import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { DebugComponent } from '~/app/shared/debug/debug.component';
import { KeyValueComponent } from '~/app/shared/key-value/key-value.component';
import { EnvironmentsService } from '~/services/environments.service';
import type { IEnvironment, IEnvironmentValueUpdateInput } from '@openworkers/api-types';

@Component({
  imports: [CommonModule, RouterLink, DebugComponent, KeyValueComponent],
  templateUrl: './environment-overview.page.html'
})
export default class EnvironmentOverviewPage {
  public readonly environment$: Observable<IEnvironment>;

  constructor(
    route: ActivatedRoute,
    private envs: EnvironmentsService
  ) {
    const env = route.parent?.snapshot.data['environment'] as Resolved<IEnvironment>;

    // Subscribe to the cached observable to get live updates
    this.environment$ = env.asObservable?.() ?? this.envs.findById(env.id);
  }

  update(id: string, values: IEnvironmentValueUpdateInput[]) {
    firstValueFrom(this.envs.update({ id, values }));
  }
}
