import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { EnvironmentsService } from '~/app/services/environments.service';
import { WorkersService } from '~/app/services/workers.service';
import { SharedModule } from '~/app/shared/shared.module';
import type { IEnvironment, IWorker } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule],
  selector: 'app-worker-environment',
  templateUrl: 'environment.component.html'
})
export class EnvironmentComponent {
  public editing = false;

  public readonly worker: IWorker;
  public readonly form: FormControl;
  public readonly environments$: Observable<IEnvironment[]>;

  constructor(
    route: ActivatedRoute,
    private workers: WorkersService,
    environments: EnvironmentsService
  ) {
    this.worker = route.parent?.snapshot.data['worker'] as IWorker;
    this.environments$ = environments.findAll();
    this.form = new FormControl(this.worker.environment?.id ?? null);
  }

  async submitForm() {
    this.form.markAsPending();

    try {
      await this.updateEnvironment(this.form.value);
    } catch (error) {
      // TODO: Handle error
      console.error(error);
    } finally {
      this.form.markAsPristine();
    }
  }

  async resetForm() {
    this.form.reset();
    this.form.setValue(this.worker.environment?.id ?? null);
    this.editing = false;
  }

  async updateEnvironment(environment: string | null) {
    const id = this.worker.id;
    const worker = await firstValueFrom(this.workers.update({ id, environment }));
    Object.assign(this.worker, worker);
    this.resetForm();
  }
}
