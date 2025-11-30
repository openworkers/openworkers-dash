import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { catchError, map, mergeMap, Observable, of, ReplaySubject, tap } from 'rxjs';

import type { ILoginResponse, ISelf } from '@openworkers/api-types';
import { LocalStorage } from './local-storage.service';
import { Router } from '@angular/router';
import { logger } from '~/logger';
import { BypassAuthInterceptor } from '../interceptors/auth.interceptor';

const log = logger.getLogger('AuthService');

const ACCESS_TOKEN_KEY = 'access-token';
const REFRESH_TOKEN_KEY = 'refresh-token';

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
}

function decodeToken(token: string) {
  const match = /^([a-z0-9_=]+)\.([a-z0-9_=]+)\.([a-z0-9_\-\+\/=]*)/gi.exec(token);
  if (!match) {
    return null;
  }

  try {
    return { token: match[0], payload: JSON.parse(window.atob(match[2])) as JWTPayload };
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly com: BroadcastChannel;
  private accessToken: string | null = null;
  private accessTokenExp: number | null = null;
  private refreshToken: string | null = null;
  private refreshTokenExp: number | null = null;

  private readonly user$$ = new ReplaySubject<ISelf | null>(1);
  public readonly user$ = this.user$$.asObservable();

  constructor(
    private httpClient: HttpClient,
    private storage: LocalStorage,
    router: Router
  ) {
    log.debug('Instantiate AuthService');
    this.com = new BroadcastChannel('channel:auth');

    this.setAccessToken(this.storage.getItem(ACCESS_TOKEN_KEY));
    this.setRefreshToken(this.storage.getItem(REFRESH_TOKEN_KEY));

    this.com.addEventListener('message', ({ data: user }: MessageEvent<ISelf | null>) => {
      log.debug('AUTH', user, router.url);
      this.user$$.next(user);
      router.navigate([user ? '/workers' : '/login']);
    });
  }

  public init(): Observable<ISelf | null> {
    if (!this.getAccessToken()) {
      return of(null).pipe(tap(() => this.logout()));
    }

    return this.httpClient.get<ISelf>('/api/v1/profile').pipe(
      catchError((err) => of(null)),
      tap((user) => this.user$$.next(user))
    );
  }

  public getAccessToken() {
    return this.accessToken;
  }

  public accessTokenExpired() {
    return this.accessTokenExp !== null && this.accessTokenExp < Date.now();
  }

  private setAccessToken(value: string | null) {
    const decoded = value ? decodeToken(value) : null;
    this.accessToken = decoded ? decoded.token : null;
    this.accessTokenExp = decoded ? decoded.payload.exp * 1000 : null;
    this.storage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
  }

  private getRefreshToken() {
    return this.refreshToken;
  }

  private refreshTokenExpired() {
    return this.refreshTokenExp !== null && this.refreshTokenExp < Date.now();
  }

  private setRefreshToken(value: string | null) {
    const decoded = value ? decodeToken(value) : null;
    this.refreshToken = decoded ? decoded.token : null;
    this.refreshTokenExp = decoded ? decoded.payload.exp * 1000 : null;
    this.storage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
  }

  private setTokens(value: ILoginResponse) {
    this.setAccessToken(value.accessToken);
    this.setRefreshToken(value.refreshToken);
  }

  private clearTokens() {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }

  public refreshTokens(): Observable<boolean> {
    if (this.refreshTokenExpired()) {
      return of(false).pipe(tap(() => this.logout()));
    }

    const refreshToken = this.getRefreshToken();
    const context = new HttpContext().set(BypassAuthInterceptor, true);
    return this.httpClient.post<ILoginResponse>('/api/v1/refresh', { refreshToken }, { context }).pipe(
      tap((tokens) => this.setTokens(tokens)),
      catchError((err) => of(null)),
      tap((tokens) => !tokens && this.logout()),
      map((e) => !!e)
    );
  }

  public forwardGithubCode(code: string): Observable<boolean> {
    return this.httpClient.get<ILoginResponse>('/api/v1/callback/github', { params: { code } }).pipe(
      tap((tokens) => this.setTokens(tokens)),
      mergeMap(() => this.init()),
      tap((user) => this.com.postMessage(user)),
      map((e) => !!e)
    );
  }

  public login(username: string, password: string): Observable<boolean> {
    return this.httpClient.post<ILoginResponse>('/api/v1/login', { username, password }).pipe(
      tap((tokens) => this.setTokens(tokens)),
      mergeMap(() => this.init()),
      tap((user) => this.com.postMessage(user)),
      map((e) => !!e),
      catchError(() => of(false))
    );
  }

  public logout() {
    this.clearTokens();
    this.storage.clear();
    this.user$$.next(null);
    this.com.postMessage(null);
  }
}
