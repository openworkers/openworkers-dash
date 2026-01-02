import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface ApiKey {
  id: string;
  name: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ApiKeyWithToken extends ApiKey {
  token: string;
}

@Injectable({ providedIn: 'root' })
export class ApiKeysService {
  private readonly keys$$ = new BehaviorSubject<ApiKey[]>([]);
  public readonly keys$ = this.keys$$.asObservable();

  constructor(private http: HttpClient) {}

  public loadKeys(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>('/api/v1/api-keys').pipe(
      tap((keys) => this.keys$$.next(keys))
    );
  }

  public createKey(name: string, expiresAt?: string): Observable<ApiKeyWithToken> {
    const body: { name: string; expiresAt?: string } = { name };

    if (expiresAt) {
      body.expiresAt = expiresAt;
    }

    return this.http.post<ApiKeyWithToken>('/api/v1/api-keys', body).pipe(
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
