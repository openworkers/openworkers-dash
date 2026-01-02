import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import type { IApiKey, IApiKeyCreateInput, IApiKeyCreateResponse } from '@openworkers/api-types';

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  private readonly keys$$ = new BehaviorSubject<IApiKey[]>([]);
  public readonly keys$ = this.keys$$.asObservable();

  constructor(private http: HttpClient) {}

  public loadKeys(): Observable<IApiKey[]> {
    return this.http.get<IApiKey[]>('/api/v1/api-keys').pipe(tap((keys) => this.keys$$.next(keys)));
  }

  public createKey(name: string, expiresAt?: string): Observable<IApiKeyCreateResponse> {
    const body: IApiKeyCreateInput = { name };

    if (expiresAt) {
      body.expiresAt = expiresAt;
    }

    return this.http.post<IApiKeyCreateResponse>('/api/v1/api-keys', body).pipe(
      tap((newKey) => {
        const current = this.keys$$.value;
        this.keys$$.next([newKey, ...current]);
      })
    );
  }

  public deleteKey(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/api-keys/${id}`).pipe(
      tap(() => {
        const current = this.keys$$.value;
        this.keys$$.next(current.filter((k) => k.id !== id));
      })
    );
  }
}
