import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, mergeMap, Observable, throwError } from 'rxjs';
import { IResourceCommon } from '~/app/interfaces/resource-common';
import { AuthService } from '~/app/services/auth.service';
import { SharedModule } from '~/app/shared/shared.module';
import { getWorkerUrl } from '~/app/utils/url';
import type { IResourceLimits } from '@openworkers/api-types';

// Map resource name to limit key (most just add 's', but 'kv' stays 'kv')
const LIMIT_KEY_MAP: Record<string, keyof IResourceLimits> = {
  worker: 'workers',
  environment: 'environments',
  database: 'databases',
  kv: 'kv'
};

@Component({
  standalone: true,
  imports: [SharedModule],
  templateUrl: 'resource-list.page.html'
})
export default class ResourceListPage {
  public readonly resourceName$: Observable<string>;
  public readonly resourceLimit$!: Observable<number>;
  public readonly resourceList$: Observable<IResourceCommon[]>;

  constructor(route: ActivatedRoute, { user$ }: AuthService) {
    this.resourceName$ = route.data.pipe(map((data) => data['resourceName']));
    this.resourceLimit$ = this.resourceName$.pipe(
      map((name: string) => LIMIT_KEY_MAP[name] ?? `${name}s` as keyof IResourceLimits),
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      mergeMap((name) => user$.pipe(map((user) => (user?.limits ?? {})[name] ?? -1))),
      mergeMap((limit) => (typeof limit === 'number' ? [limit] : throwError(() => new Error('Unreachable'))))
    );
    this.resourceList$ = route.data.pipe(
      map((data) => data['resourceList'] as IResourceCommon[]),
      map((list) => list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    );
  }

  public getWorkerUrl(workerId: string) {
    return getWorkerUrl(workerId);
  }
}
