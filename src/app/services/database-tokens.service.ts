import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export type DatabaseOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'CREATE' | 'ALTER' | 'DROP';

export interface IDatabaseToken {
  id: string;
  databaseId: string;
  name: string;
  tokenPrefix: string;
  allowedOperations: DatabaseOperation[];
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface IDatabaseTokenCreateInput {
  name: string;
  allowedOperations?: DatabaseOperation[];
}

export interface IDatabaseTokenCreateResponse extends IDatabaseToken {
  token: string;
}

export interface IExecResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

@Injectable({ providedIn: 'root' })
export class DatabaseTokensService {
  private readonly tokens$$ = new BehaviorSubject<IDatabaseToken[]>([]);
  public readonly tokens$ = this.tokens$$.asObservable();

  constructor(private http: HttpClient) {}

  public loadTokens(databaseId: string): Observable<IDatabaseToken[]> {
    return this.http
      .get<IDatabaseToken[]>(`/api/v1/databases/${databaseId}/tokens`)
      .pipe(tap((tokens) => this.tokens$$.next(tokens)));
  }

  public createToken(databaseId: string, input: IDatabaseTokenCreateInput): Observable<IDatabaseTokenCreateResponse> {
    return this.http.post<IDatabaseTokenCreateResponse>(`/api/v1/databases/${databaseId}/tokens`, input).pipe(
      tap((newToken) => {
        const current = this.tokens$$.value;
        this.tokens$$.next([newToken, ...current]);
      })
    );
  }

  public deleteToken(databaseId: string, tokenId: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/databases/${databaseId}/tokens/${tokenId}`).pipe(
      tap(() => {
        const current = this.tokens$$.value;
        this.tokens$$.next(current.filter((t) => t.id !== tokenId));
      })
    );
  }

  public clearTokens(): void {
    this.tokens$$.next([]);
  }

  public exec(databaseId: string, sql: string, params?: unknown[]): Observable<IExecResult> {
    return this.http.post<IExecResult>(`/api/v1/databases/${databaseId}/exec`, { sql, params });
  }
}
