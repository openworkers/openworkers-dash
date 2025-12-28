import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import type { IDatabase, IDatabaseCreateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

interface IDatabaseUpdateInput {
  id: string;
  name?: string;
  desc?: string | null;
  maxRows?: number;
  timeoutSeconds?: number;
}

@Injectable({ providedIn: 'root' })
export class DatabasesService extends ResourceService<IDatabase, IDatabaseCreateInput, IDatabaseUpdateInput> {
  constructor(http: HttpClient) {
    super(http, 'databases');
  }
}
