import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import type { IDatabase, IDatabaseCreateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

// Database doesn't have update, so we use a minimal type
interface IDatabaseUpdateInput {
  id: string;
}

interface RegenerateTokenResponse {
  token: string;
  tokenId: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class DatabasesService extends ResourceService<IDatabase, IDatabaseCreateInput, IDatabaseUpdateInput> {
  constructor(http: HttpClient) {
    super(http, 'databases');
  }

  regenerateToken(id: string): Observable<RegenerateTokenResponse> {
    return this.http.post<RegenerateTokenResponse>(`/api/v1/databases/${id}/token`, {});
  }
}
