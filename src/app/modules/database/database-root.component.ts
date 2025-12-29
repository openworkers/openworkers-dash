import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DatabasesService } from '~/app/services/databases.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import type { IDatabase } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [ResourceRootComponent],
  template: `
    <app-resource-root
      resourceName="Database"
      [resource]="database"
      [menuLinks]="['overview']"
      (update)="update($event)"
      (delete)="delete()"
    />
  `
})
export default class DatabaseRootComponent {
  public readonly database: IDatabase;

  constructor(
    route: ActivatedRoute,
    private dbs: DatabasesService,
    private router: Router
  ) {
    this.database = route.snapshot.data['database'] as IDatabase;
  }

  public update(changes: Partial<IDatabase>) {
    firstValueFrom(this.dbs.update({ id: this.database.id, ...changes }));
  }

  public delete() {
    firstValueFrom(this.dbs.delete(this.database.id)).then(() => this.router.navigate(['/databases']));
  }
}
