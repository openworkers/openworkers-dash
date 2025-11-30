import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorkersService } from '~/app/services/workers.service';
import type { IWorker } from '@openworkers/api-types';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';

@Component({
  template: `
    <app-resource-root
      resourceName="Worker"
      [resource]="worker"
      [menuLinks]="['overview', 'edit', 'logs']"
      (update)="update($event)"
      (delete)="delete()"
    />
  `,
  imports: [ResourceRootComponent]
})
export class WorkerRootComponent {
  public readonly worker: IWorker;

  constructor(
    route: ActivatedRoute,
    private workers: WorkersService,
    private router: Router
  ) {
    this.worker = route.snapshot.data['worker'] as IWorker;
  }

  public async update(update: Partial<Pick<IWorker, 'name' | 'desc'>>) {
    const worker = await firstValueFrom(this.workers.update({ id: this.worker.id, ...update }));
    Object.assign(this.worker, worker);
  }

  public async delete() {
    return firstValueFrom(this.workers.delete(this.worker.id)).then(() => this.router.navigate(['/workers']));
  }
}
