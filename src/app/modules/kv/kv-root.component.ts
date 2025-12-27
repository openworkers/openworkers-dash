import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { KvService } from '~/app/services/kv.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import type { IKvNamespace, IKvNamespaceUpdateInput } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [ResourceRootComponent],
  template: `
    <app-resource-root
      resourceName="KV Namespace"
      [resource]="kv"
      [menuLinks]="['overview']"
      (update)="update($event)"
      (delete)="delete()"
    />
  `
})
export default class KvRootComponent {
  public readonly kv: IKvNamespace;

  constructor(
    route: ActivatedRoute,
    private kvService: KvService,
    private router: Router
  ) {
    this.kv = route.snapshot.data['kv'] as IKvNamespace;
  }

  public update(data: Partial<IKvNamespaceUpdateInput>) {
    firstValueFrom(this.kvService.update({ id: this.kv.id, ...data }));
  }

  public delete() {
    firstValueFrom(this.kvService.delete(this.kv.id)).then(() => this.router.navigate(['/kv-namespaces']));
  }
}
