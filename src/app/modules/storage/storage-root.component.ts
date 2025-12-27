import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { StorageService } from '~/app/services/storage.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import type { IStorageConfig, IStorageConfigUpdateInput } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [ResourceRootComponent],
  template: `
    <app-resource-root
      resourceName="Storage Config"
      [resource]="storage"
      [menuLinks]="['overview']"
      (update)="update($event)"
      (delete)="delete()"
    />
  `
})
export default class StorageRootComponent {
  public readonly storage: IStorageConfig;

  constructor(
    route: ActivatedRoute,
    private storageService: StorageService,
    private router: Router
  ) {
    this.storage = route.snapshot.data['storage'] as IStorageConfig;
  }

  public update(data: Partial<IStorageConfigUpdateInput>) {
    firstValueFrom(this.storageService.update({ id: this.storage.id, ...data }));
  }

  public delete() {
    firstValueFrom(this.storageService.delete(this.storage.id)).then(() => this.router.navigate(['/storage']));
  }
}
