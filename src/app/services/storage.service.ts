import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import type { IStorageConfig, IStorageConfigCreateInput, IStorageConfigUpdateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class StorageService extends ResourceService<
  IStorageConfig,
  IStorageConfigCreateInput,
  IStorageConfigUpdateInput & { id: string }
> {
  constructor(http: HttpClient) {
    super(http, 'storage');
  }
}
