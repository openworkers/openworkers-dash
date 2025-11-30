import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';

import { EnvironmentComponent } from './components/environment/environment.component';
import { DomainsComponent } from './components/domains/domains.component';

import { WorkersService } from '~/app/services/workers.service';
import { SharedModule } from '~/app/shared/shared.module';
import type { IWorker } from '@openworkers/api-types';
import { CronComponent } from './components/cron/cron.component';

@Component({
  standalone: true,
  imports: [
    CommonModule, //
    EnvironmentComponent,
    DomainsComponent,
    CronComponent,
    SharedModule
  ],
  templateUrl: './worker-overview.page.html'
})
export default class WorkerOverviewPage {
  public readonly worker$: Observable<IWorker>;

  constructor(
    route: ActivatedRoute,
    private workersService: WorkersService
  ) {
    const worker = route.parent?.snapshot.data['worker'] as Resolved<IWorker>;

    // Subscribe to the cached observable to get live updates
    this.worker$ = worker.asObservable();
  }

  public updateWorkerDomains(id: string, domains: string[]) {
    firstValueFrom(this.workersService.update({ id, domains }));
  }
}
