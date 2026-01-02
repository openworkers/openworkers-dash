import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import type { IKvNamespace, IKvNamespaceCreateInput, IKvNamespaceUpdateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class KvService extends ResourceService<
  IKvNamespace,
  IKvNamespaceCreateInput,
  IKvNamespaceUpdateInput & { id: string }
> {
  constructor(http: HttpClient) {
    super(http, 'kv');
  }
}
