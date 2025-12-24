import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  code: string;
  diagnostics: string[];
  messages: ChatMessage[];
  userMessage: string;
  enableThinking?: boolean;
  thinkingBudget?: number;
}

export interface ChatResponse {
  response: string;
  appliedCode: string | null;
}

export interface TranscribeResponse {
  text: string;
}

// Usage information from Claude API
export interface UsageInfo {
  input_tokens?: number;
  output_tokens?: number;
}

// Streaming event types
export type StreamEvent =
  | { type: 'message_start'; id: string; model: string; usage?: UsageInfo }
  | { type: 'text'; content: string }
  | { type: 'thinking_start' }
  | { type: 'thinking'; content: string }
  | { type: 'thinking_stop' }
  | { type: 'code_start'; tool: string }
  | { type: 'code_complete'; code: string; explanation: string }
  | { type: 'message_delta'; stopReason?: string; usage?: UsageInfo }
  | { type: 'ping' }
  | { type: 'done' }
  | { type: 'error'; message: string; errorType?: string };

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private http: HttpClient) {}

  chat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>('/api/v1/ai/chat', request);
  }

  chatStream(request: ChatRequest): Observable<StreamEvent> {
    const subject = new Subject<StreamEvent>();
    let processedLength = 0;

    this.http
      .post('/api/v1/ai/chat/stream', request, {
        responseType: 'text',
        observe: 'events',
        reportProgress: true
      })
      .subscribe({
        next: (event: HttpEvent<string>) => {
          if (event.type === HttpEventType.DownloadProgress) {
            const progressEvent = event as HttpDownloadProgressEvent;
            const partialText = progressEvent.partialText || '';

            // Process only new content
            const newContent = partialText.slice(processedLength);
            processedLength = partialText.length;

            if (newContent) {
              this.parseSSEChunk(newContent, subject);
            }
          }
        },
        error: (error) => {
          subject.next({ type: 'error', message: error.message || 'Stream failed' });
          subject.complete();
        },
        complete: () => {
          subject.complete();
        }
      });

    return subject.asObservable();
  }

  private parseSSEChunk(chunk: string, subject: Subject<StreamEvent>) {
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;

      const data = line.slice(6).trim();

      if (!data) continue;

      try {
        const event = JSON.parse(data) as StreamEvent;

        // Skip ping events - they're just for keep-alive
        if (event.type === 'ping') continue;

        subject.next(event);
      } catch {
        // Ignore parse errors
      }
    }
  }

  transcribe(audio: Blob): Observable<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audio, 'audio.webm');
    return this.http.post<TranscribeResponse>('/api/v1/ai/transcribe', formData);
  }
}
