import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, mergeMap, Observable, tap, throwError } from 'rxjs';
import { ResourceService } from '~/app/services/resource.service';
import { AuthService } from '../services/auth.service';
import type { IResourceLimits } from '@openworkers/api-types';

@Injectable()
export class MaximumGuard implements CanActivate {
  constructor(
    private router: Router,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    private resourceService: ResourceService<any, any, any>,
    private authService: AuthService
  ) {}

  canActivate(): Observable<boolean> {
    const resourceName = `${this.resourceService.getResourceName().toLowerCase()}` as keyof IResourceLimits;

    return this.authService.user$.pipe(
      // biome-ignore lint/complexity/useOptionalChain: <explanation>
      map((user) => (user?.limits ?? {})[resourceName] ?? -1),
      tap((limit) => {
        console.log('MaximumGuard: limit for', resourceName, 'is', limit);
      }),
      mergeMap((limit) =>
        typeof limit === 'number'
          ? this.resourceService.findAll().pipe(map((resources) => resources.length < limit))
          : throwError(() => new Error('Maximum guard cannot be used for this resource'))
      ),
      tap((ok) => !ok && this.router.navigate([`/${resourceName}`]))
    );
  }
}
