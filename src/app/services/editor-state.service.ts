import { Injectable, signal, computed, effect } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { ChatMessage } from './ai.service';

// Database schema
interface ConversationRecord {
  id?: number;
  workerId: string;
  messages: ChatMessage[];
  thinkingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class EditorDatabase extends Dexie {
  conversations!: Table<ConversationRecord>;

  constructor() {
    super('OpenWorkersEditor');

    this.version(1).stores({
      conversations: '++id, workerId, updatedAt'
    });
  }
}

@Injectable({ providedIn: 'root' })
export class EditorStateService {
  private db = new EditorDatabase();

  // Current worker context
  private _workerId = signal<string | null>(null);
  private _conversationId = signal<number | null>(null);

  // Editor state
  private _code = signal<string>('');
  private _diagnostics = signal<string[]>([]);

  // Chat state
  private _messages = signal<ChatMessage[]>([]);
  private _thinkingEnabled = signal<boolean>(false);
  private _isStreaming = signal<boolean>(false);
  private _streamingText = signal<string>('');
  private _thinkingText = signal<string>('');

  // Public readonly signals
  readonly workerId = this._workerId.asReadonly();
  readonly code = this._code.asReadonly();
  readonly diagnostics = this._diagnostics.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly thinkingEnabled = this._thinkingEnabled.asReadonly();
  readonly isStreaming = this._isStreaming.asReadonly();
  readonly streamingText = this._streamingText.asReadonly();
  readonly thinkingText = this._thinkingText.asReadonly();

  // Computed
  readonly hasMessages = computed(() => this._messages().length > 0);
  readonly canSend = computed(() => !this._isStreaming());

  constructor() {
    // Auto-save messages when they change
    effect(() => {
      const messages = this._messages();
      const workerId = this._workerId();
      const conversationId = this._conversationId();

      if (workerId && conversationId && messages.length > 0) {
        this.saveConversation();
      }
    });
  }

  // Initialize for a specific worker
  async init(workerId: string, initialCode: string): Promise<void> {
    this._workerId.set(workerId);
    this._code.set(initialCode);
    this._diagnostics.set([]);

    // Reset streaming state
    this._isStreaming.set(false);
    this._streamingText.set('');
    this._thinkingText.set('');

    // Load existing conversation or create new
    await this.loadConversation(workerId);
  }

  // Load conversation from Dexie
  private async loadConversation(workerId: string): Promise<void> {
    const conversation = await this.db.conversations.where('workerId').equals(workerId).first();

    if (conversation) {
      this._conversationId.set(conversation.id!);
      this._messages.set(conversation.messages);
      this._thinkingEnabled.set(conversation.thinkingEnabled);
    } else {
      // Create new conversation
      const id = await this.db.conversations.add({
        workerId,
        messages: [],
        thinkingEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      this._conversationId.set(id);
      this._messages.set([]);
      this._thinkingEnabled.set(false);
    }
  }

  // Save conversation to Dexie
  private async saveConversation(): Promise<void> {
    const conversationId = this._conversationId();

    if (!conversationId) return;

    await this.db.conversations.update(conversationId, {
      messages: this._messages(),
      thinkingEnabled: this._thinkingEnabled(),
      updatedAt: new Date()
    });
  }

  // Code updates (from Monaco)
  updateCode(code: string): void {
    this._code.set(code);
  }

  // Diagnostics updates (from Monaco)
  updateDiagnostics(diagnostics: string[]): void {
    this._diagnostics.set(diagnostics);
  }

  // Toggle thinking mode
  toggleThinking(): void {
    this._thinkingEnabled.update((v) => !v);
    this.saveConversation();
  }

  setThinkingEnabled(enabled: boolean): void {
    this._thinkingEnabled.set(enabled);
    this.saveConversation();
  }

  // Add user message
  addUserMessage(content: string): void {
    this._messages.update((msgs) => [...msgs, { role: 'user' as const, content }]);
  }

  // Add assistant message
  addAssistantMessage(content: string): void {
    this._messages.update((msgs) => [...msgs, { role: 'assistant' as const, content }]);
  }

  // Start streaming
  startStreaming(): void {
    this._isStreaming.set(true);
    this._streamingText.set('');
    this._thinkingText.set('');
  }

  // Append to streaming text
  appendStreamingText(text: string): void {
    this._streamingText.update((current) => current + text);
  }

  // Append to thinking text
  appendThinkingText(text: string): void {
    this._thinkingText.update((current) => current + text);
  }

  // Finalize streaming (convert to message)
  finalizeStreaming(): void {
    const streamingText = this._streamingText();

    if (streamingText) {
      this.addAssistantMessage(streamingText);
    }

    this._isStreaming.set(false);
    this._streamingText.set('');
    this._thinkingText.set('');
  }

  // Stop streaming without saving
  cancelStreaming(): void {
    this._isStreaming.set(false);
    this._streamingText.set('');
    this._thinkingText.set('');
  }

  // Clear conversation
  async clearConversation(): Promise<void> {
    this._messages.set([]);
    this._streamingText.set('');
    this._thinkingText.set('');
    await this.saveConversation();
  }

  // Get messages for API call (filter out system messages if any)
  getMessagesForApi(): ChatMessage[] {
    return this._messages().filter((m) => m.role === 'user' || m.role === 'assistant');
  }

  // Cleanup on destroy
  async cleanup(): Promise<void> {
    await this.saveConversation();
  }
}
