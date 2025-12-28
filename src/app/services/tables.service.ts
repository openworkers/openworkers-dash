import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ITableInfo,
  ITableDetails,
  IColumnDefinition,
  ICreateTableInput
} from '@openworkers/api-types';

@Injectable({ providedIn: 'root' })
export class TablesService {
  constructor(private http: HttpClient) {}

  listTables(databaseId: string): Observable<ITableInfo[]> {
    return this.http.get<ITableInfo[]>(`/api/v1/databases/${databaseId}/tables`);
  }

  getTable(databaseId: string, tableName: string): Observable<ITableDetails> {
    return this.http.get<ITableDetails>(`/api/v1/databases/${databaseId}/tables/${tableName}`);
  }

  createTable(databaseId: string, input: ICreateTableInput): Observable<{ created: boolean; name: string }> {
    return this.http.post<{ created: boolean; name: string }>(`/api/v1/databases/${databaseId}/tables`, input);
  }

  dropTable(databaseId: string, tableName: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`/api/v1/databases/${databaseId}/tables/${tableName}`);
  }

  addColumn(databaseId: string, tableName: string, column: IColumnDefinition): Observable<{ created: boolean; name: string }> {
    return this.http.post<{ created: boolean; name: string }>(
      `/api/v1/databases/${databaseId}/tables/${tableName}/columns`,
      column
    );
  }

  dropColumn(databaseId: string, tableName: string, columnName: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `/api/v1/databases/${databaseId}/tables/${tableName}/columns/${columnName}`
    );
  }
}
