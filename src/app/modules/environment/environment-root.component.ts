import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EnvironmentsService } from '~/app/services/environments.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import type { IEnvironment } from '@openworkers/api-types';

@Component({
  imports: [ResourceRootComponent],
  template: `
    <app-resource-root
      resourceName="Environment"
      [resource]="environment"
      [menuLinks]="['overview']"
      (update)="update($event)"
      (delete)="delete()"
    />
  `
})
export default class EnvironmentRootComponent {
  public readonly environment: IEnvironment;

  constructor(
    route: ActivatedRoute,
    private envs: EnvironmentsService,
    private router: Router
  ) {
    this.environment = route.snapshot.data['environment'] as IEnvironment;
  }

  public update(update: Partial<Pick<IEnvironment, 'name' | 'desc'>>) {
    firstValueFrom(this.envs.update({ id: this.environment.id, ...update }));
  }

  public delete() {
    firstValueFrom(this.envs.delete(this.environment.id)).then(() => this.router.navigate(['/environments']));
  }
}
