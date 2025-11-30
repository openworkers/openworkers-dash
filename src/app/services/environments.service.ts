import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import type { IEnvironment } from '@openworkers/api-types';
import type { IEnvironmentCreateInput } from '@openworkers/api-types';
import type { IEnvironmentUpdateInput } from '@openworkers/api-types';
import { ResourceService } from './resource.service';

@Injectable({ providedIn: 'root' })
export class EnvironmentsService extends ResourceService<
  IEnvironment,
  IEnvironmentCreateInput,
  IEnvironmentUpdateInput
> {
  constructor(http: HttpClient) {
    super(http, 'environments');
  }
}
