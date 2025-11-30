import { Injectable } from '@angular/core';
import { CanActivate, CanLoad, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '~/services/auth.service';
import { map, tap } from 'rxjs';
import { logger } from '~/logger';
import type { ISelf } from '@openworkers/api-types';

const log = logger.getLogger('AuthGuard');

function isNotLoggedFactory(context: string, user$: Observable<ISelf | null>, router: Router) {
  return () =>
    user$.pipe(
      map((user) => user === null),
      tap((anon) => log.debug('anon?', context, anon)),
      tap((anon) => !anon && router.navigate(['/workers']))
    );
}

function isLoggedFactory(context: string, user$: Observable<ISelf | null>, router: Router) {
  return () =>
    user$.pipe(
      map((user) => user !== null),
      tap((logged) => log.debug('logged?', context, logged)),
      tap((logged) => !logged && router.navigate(['/sign-in']))
    );
}

@Injectable({ providedIn: 'root' })
export class LoggedAuthGuard implements CanActivate, CanLoad {
  public canLoad: () => Observable<boolean>;
  public canActivate: () => Observable<boolean>;

  constructor({ user$ }: AuthService, router: Router) {
    this.canLoad = isLoggedFactory('load', user$, router);
    this.canActivate = isLoggedFactory('activate', user$, router);
  }
}

@Injectable({ providedIn: 'root' })
export class NotLoggedAuthGuard implements CanActivate, CanLoad {
  public canLoad: () => Observable<boolean>;
  public canActivate: () => Observable<boolean>;

  constructor({ user$ }: AuthService, router: Router) {
    this.canLoad = isNotLoggedFactory('load', user$, router);
    this.canActivate = isNotLoggedFactory('activate', user$, router);
  }
}
