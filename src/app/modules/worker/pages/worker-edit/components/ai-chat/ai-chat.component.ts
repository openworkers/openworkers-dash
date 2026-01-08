import { CommonModule } from '@angular/common';
import {
  Component,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  OnDestroy,
  inject
} from '@angular/core';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiService, StreamEvent, UsageInfo, ClaudeModel } from '~/app/services/ai.service';
import { EditorStateService } from '~/app/services/editor-state.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { NgIconComponent } from '@ng-icons/core';

const CLAUDE_TOKEN_KEY = 'claude_token';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, MonacoEditorModule, NgIconComponent],
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css']
})
export class AiChatComponent implements OnDestroy {
  @Output() codeApplied = new EventEmitter<string>();

  @ViewChild('outputArea') outputArea?: ElementRef<HTMLDivElement>;
  @ViewChild('inputField') inputField?: ElementRef<HTMLInputElement>;

  // Inject services
  private aiService = inject(AiService);
  private cdr = inject(ChangeDetectorRef);
  readonly store = inject(EditorStateService);

  // Check if Claude token is configured
  get hasClaudeToken(): boolean {
    return !!localStorage.getItem(CLAUDE_TOKEN_KEY);
  }

  // Local UI state (not persisted)
  recording = false;
  transcribing = false;
  showDiff = false;
  pendingCode = '';
  diffExplanation = '';
  generatingCode = false;
  isThinking = false;
  thinkingCollapsed = false;

  // Usage tracking (session only)
  usage: UsageInfo | null = null;

  // Model selection
  selectedModel: ClaudeModel = 'sonnet';

  private mediaRecorder?: MediaRecorder;
  private audioChunks: Blob[] = [];
  private streamSubscription?: Subscription;

  userInput = new FormControl('');

  // Monaco diff editor config
  diffOptions = {
    theme: 'vs',
    readOnly: true,
    renderSideBySide: true,
    automaticLayout: true,
    language: 'typescript'
  };

  originalCode = '';
  modifiedCode = '';

  hints = ['Add error handling', 'Explain this code', 'Add debug logs', 'Make it prettier'];

  ngOnDestroy() {
    this.streamSubscription?.unsubscribe();
    this.store.cleanup();
  }

  quickPrompt(prompt: string) {
    this.userInput.setValue(prompt);
    this.sendMessage();
  }

  askToFix() {
    const issues = this.store.diagnostics().join('\n');
    this.userInput.setValue(`Fix these TypeScript issues:\n${issues}`);
    this.sendMessage();
  }

  acceptCode() {
    if (this.pendingCode) {
      this.codeApplied.emit(this.pendingCode);
      this.store.addAssistantMessage(`✅ ${this.diffExplanation || 'Code applied'}`);
    }

    this.closeDiff();
  }

  rejectCode() {
    this.store.addAssistantMessage('❌ Code changes rejected');
    this.closeDiff();
  }

  private closeDiff() {
    this.showDiff = false;
    this.pendingCode = '';
    this.diffExplanation = '';
    this.store.cancelStreaming();
    this.isThinking = false;
    this.cdr.detectChanges();
    this.scrollToBottom();
    this.inputField?.nativeElement.focus();
  }

  async toggleRecording() {
    if (this.recording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await this.transcribeAudio();
      };

      this.mediaRecorder.start();
      this.recording = true;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.recording) {
      this.mediaRecorder.stop();
      this.recording = false;
      this.cdr.detectChanges();
    }
  }

  private async transcribeAudio() {
    if (this.audioChunks.length === 0) return;

    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

    try {
      this.transcribing = true;
      this.cdr.detectChanges();

      const result = await firstValueFrom(this.aiService.transcribe(audioBlob));

      const currentValue = this.userInput.value || '';
      this.userInput.setValue(currentValue + (currentValue ? ' ' : '') + result.text);
      this.inputField?.nativeElement.focus();
    } catch (error) {
      console.error('Transcription error:', error);
    } finally {
      this.transcribing = false;
      this.cdr.detectChanges();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.outputArea) {
        this.outputArea.nativeElement.scrollTop = this.outputArea.nativeElement.scrollHeight;
      }
    });
  }

  toggleThinking() {
    this.store.toggleThinking();
  }

  sendMessage() {
    const content = this.userInput.value?.trim();

    if (!content || this.store.isStreaming()) return;

    // Handle /clear command
    if (content.toLowerCase() === '/clear') {
      this.userInput.setValue('');
      this.clearConversation();
      return;
    }

    this.store.addUserMessage(content);
    this.store.startStreaming();
    this.userInput.setValue('');
    this.isThinking = false;
    this.thinkingCollapsed = false;
    this.usage = null;
    this.cdr.detectChanges();
    this.scrollToBottom();

    // Use streaming API
    this.streamSubscription?.unsubscribe();
    this.streamSubscription = this.aiService
      .chatStream({
        code: this.store.code(),
        diagnostics: this.store.diagnostics(),
        messages: this.store.getMessagesForApi(),
        userMessage: content,
        model: this.selectedModel,
        enableThinking: this.store.thinkingEnabled(),
        thinkingBudget: 10000
      })
      .subscribe({
        next: (event: StreamEvent) => this.handleStreamEvent(event),
        error: (error) => {
          console.error('Stream error:', error);
          this.store.addAssistantMessage(`Error: ${error.message || 'Unknown error'}`);
          this.store.cancelStreaming();
          this.cdr.detectChanges();
          this.scrollToBottom();
        },
        complete: () => {
          // Stream completed - cleanup handled by 'done' event
          if (this.store.isStreaming() && !this.showDiff) {
            this.store.finalizeStreaming();
            this.generatingCode = false;
            this.cdr.detectChanges();
          }
        }
      });
  }

  private handleStreamEvent(event: StreamEvent) {
    switch (event.type) {
      case 'message_start':
        if (event.usage) {
          this.usage = event.usage;
        }

        this.cdr.detectChanges();
        break;

      case 'thinking_start':
        this.isThinking = true;
        this.cdr.detectChanges();
        break;

      case 'thinking':
        this.store.appendThinkingText(event.content);
        this.cdr.detectChanges();
        this.scrollToBottom();
        break;

      case 'thinking_stop':
        this.isThinking = false;
        this.thinkingCollapsed = true;
        this.cdr.detectChanges();
        break;

      case 'text':
        this.store.appendStreamingText(event.content);
        this.cdr.detectChanges();
        this.scrollToBottom();
        break;

      case 'code_start':
        // Save any streaming text as a message
        if (this.store.streamingText()) {
          this.store.finalizeStreaming();
          this.store.startStreaming();
        }

        this.generatingCode = true;
        this.cdr.detectChanges();
        break;

      case 'code_complete':
        this.pendingCode = event.code;
        this.diffExplanation = event.explanation;
        this.generatingCode = false;

        this.originalCode = this.store.code();
        this.modifiedCode = event.code;

        const isDark = document.documentElement.classList.contains('dark');
        this.diffOptions = { ...this.diffOptions, theme: isDark ? 'vs-dark' : 'vs' };

        this.showDiff = true;
        this.cdr.detectChanges();
        break;

      case 'message_delta':
        if (event.usage) {
          this.usage = event.usage;
        }

        this.cdr.detectChanges();
        break;

      case 'error':
        this.store.addAssistantMessage(`Error: ${event.message}`);
        this.store.cancelStreaming();
        this.isThinking = false;
        this.cdr.detectChanges();
        break;

      case 'done':
        if (this.store.streamingText() && !this.showDiff) {
          this.store.finalizeStreaming();
        } else {
          this.store.cancelStreaming();
        }

        this.generatingCode = false;
        this.isThinking = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
        this.inputField?.nativeElement.focus();
        break;
    }
  }

  async clearConversation() {
    await this.store.clearConversation();
    this.cdr.detectChanges();
  }
}
