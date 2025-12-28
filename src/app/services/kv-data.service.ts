import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KvDataItem {
  key: string;
  value: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KvDataListResponse {
  items: KvDataItem[];
  cursor: string | null;
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class KvDataService {
  private readonly baseUrl = '/api/v1/kv';

  constructor(private http: HttpClient) {}

  list(
    namespaceId: string,
    options?: { prefix?: string; cursor?: string; limit?: number }
  ): Observable<KvDataListResponse> {
    const params: Record<string, string> = {};

    if (options?.prefix) {
      params['prefix'] = options.prefix;
    }

    if (options?.cursor) {
      params['cursor'] = options.cursor;
    }

    if (options?.limit) {
      params['limit'] = options.limit.toString();
    }

    return this.http.get<KvDataListResponse>(`${this.baseUrl}/${namespaceId}/data`, { params });
  }

  put(
    namespaceId: string,
    key: string,
    value: string,
    expiresIn?: number
  ): Observable<KvDataItem> {
    return this.http.put<KvDataItem>(
      `${this.baseUrl}/${namespaceId}/data/${encodeURIComponent(key)}`,
      { value, expiresIn }
    );
  }

  delete(namespaceId: string, key: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${this.baseUrl}/${namespaceId}/data/${encodeURIComponent(key)}`
    );
  }
}
