import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import type { IWorker } from '@openworkers/api-types';

import { Observable, pipe, retry, scan, UnaryFunction } from 'rxjs';

import { SSEService } from '~/app/services/sse.service';
import { logger } from '~/logger';
import { CommonModule } from '@angular/common';
import { SharedModule } from '~/app/shared/shared.module';

const log = logger.getLogger('WorkerLogsPage');

interface ILog {
  type: 'log' | 'open' | 'error' | 'timeout';
  date: number;
  level?: string; // Only for type 'log'
  message?: string; // For type 'log' and maybe on type 'error'
}

function lastEvent<T>(size: number): UnaryFunction<Observable<T>, Observable<T[]>> {
  return pipe(scan((acc: T[], event: T) => [event, ...acc].slice(0, size), [] as T[]));
}

@Component({
  standalone: true,
  providers: [SSEService],
  imports: [CommonModule, SharedModule],
  templateUrl: 'worker-logs.page.html',
  styleUrls: ['worker-logs.page.css']
})
export default class WorkerLogsPage {
  public readonly worker: IWorker;

  public readonly logs$: Observable<ILog[]>;

  constructor(route: ActivatedRoute, sse: SSEService) {
    this.worker = route.parent?.snapshot.data['worker'] as IWorker;

    log.debug('Init WebSocket service');

    const subscriber = sse
      .openWebSocket(`/api/v1/workers/${this.worker.id}/ws-logs`)
      .pipe(retry({ count: 5, delay: 3000 }));

    this.logs$ = subscriber.pipe(lastEvent(50));
  }
}
