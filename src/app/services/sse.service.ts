import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnsiUp } from 'ansi_up';

interface IEvent {
  type: string;
}

interface IOpen extends IEvent {
  type: 'open';
  date: number;
}

interface IError extends IEvent {
  type: 'error';
  date: number;
  message?: string;
}

interface ITimeout extends IEvent {
  type: 'timeout';
  date: number;
}

@Injectable()
export class SSEService {
  private ansiUp = new AnsiUp();

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private parseLogData(data: string): any {
    try {
      const log = JSON.parse(data);
      log.message = this.ansiUp.ansi_to_html(log.message);

      return log;
    } catch (error) {
      return 'Error parsing JSON data';
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  public openEventSource<T extends IEvent>(url: string): Observable<any> {
    return new Observable<T | IOpen | IError | ITimeout>((subscriber) => {
      const eventSource = new EventSource(url);

      eventSource.addEventListener('log', (event: MessageEvent) => {
        subscriber.next({ type: 'log', ...this.parseLogData(event.data) });
      });

      eventSource.addEventListener('open', () => {
        subscriber.next({ type: 'open', date: Date.now() });
      });

      eventSource.addEventListener('error', (event: MessageEvent) => {
        console.warn('Error', event, event.data);

        // Timeout error
        if (typeof event.data === 'string' && event.data === 'Request Timeout') {
          console.warn('Timeout error, bye bye');
          subscriber.next({ type: 'timeout', date: Date.now() });
          subscriber.complete();
          return;
        }

        subscriber.next({ type: 'error', date: Date.now(), message: event.data });
        subscriber.error(event.data);
      });

      return () => eventSource.close();
    });
  }
}
