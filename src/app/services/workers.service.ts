import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { first, map, mergeMap } from 'rxjs';
import type { IWorker, IWorkerCreateInput, IWorkerUpdateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

type IWorkerWithName = IWorker & { name: string };

// Frontend-specific type that includes id for cache management
type WorkerUpdateInput = IWorkerUpdateInput & { id: string };

@Injectable({ providedIn: 'root' })
export class WorkersService extends ResourceService<IWorkerWithName, IWorkerCreateInput, WorkerUpdateInput> {
  constructor(http: HttpClient) {
    super(http, 'workers');
  }

  /**
   * Fetch worker with script included (for editor page).
   */
  findByIdWithScript(id: string) {
    return this.http.get<IWorkerWithName>(`/api/v1/workers/${id}`, { params: { script: 'true' } }).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((data) => data.asObservable())
    );
  }

  /**
   * Resolver for editor page (includes script).
   */
  resolveWithScript(route: ActivatedRouteSnapshot) {
    const id = route.paramMap.get('id');

    if (!id) {
      throw new Error('Missing id');
    }

    return this.findByIdWithScript(id).pipe(first());
  }

  createCron(workerId: string, value: string) {
    return this.http.post<IWorkerWithName>(`/api/v1/workers/${workerId}/crons`, { expression: value }).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((worker) => worker.asObservable())
    );
  }

  updateCron(id: string, value: string) {
    return this.http.patch<IWorkerWithName>(`/api/v1/crons/${id}`, { expression: value }).pipe(
      map((data) => this.cacheAndWatch(data)),
      mergeMap((worker) => worker.asObservable())
    );
  }

  deleteCron(id: string) {
    return this.http.delete<IWorkerWithName>(`/api/v1/crons/${id}`).pipe(
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
