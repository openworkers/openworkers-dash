import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, mergeMap } from 'rxjs';
import type { IWorker, IWorkerCreateInput, IWorkerUpdateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

// Frontend-specific type that includes id for cache management
type WorkerUpdateInput = IWorkerUpdateInput & { id: string };

@Injectable({ providedIn: 'root' })
export class WorkersService extends ResourceService<IWorker, IWorkerCreateInput, WorkerUpdateInput> {
  constructor(http: HttpClient) {
    super(http, 'workers');
  }

  createCron(workerId: string, value: string) {
    return this.http.post<IWorker>(`/api/v1/workers/${workerId}/crons`, { expression: value }).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((worker) => worker.asObservable())
    );
  }

  updateCron(id: string, value: string) {
    return this.http.put<IWorker>(`/api/v1/crons/${id}`, { expression: value }).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((worker) => worker.asObservable())
    );
  }

  deleteCron(id: string) {
    return this.http.delete<IWorker>(`/api/v1/crons/${id}`).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((worker) => worker.asObservable())
    );
  }

  nameExistsValidator() {
    return (control: { value: string }) => {
      return this.http.get<{ exists: boolean }>(`/api/v1/workers/name-exists/${control.value}`).pipe(
        // Map to validation error or null
        map((res) => (res.exists ? { nameExists: true } : null))
      );
    };
  }
}
