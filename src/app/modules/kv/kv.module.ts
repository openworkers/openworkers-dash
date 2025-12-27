import { inject, NgModule } from '@angular/core';
import { provideRoutes } from '~/app/utils/router';
import { MaximumGuard } from '~/app/guards/maximum.guard';
import { UUIDGuard } from '~/app/guards/uuid.guard';
import { KvService } from '~/app/services/kv.service';
import { ResourceService } from '~/app/services/resource.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import { SharedModule } from '~/app/shared/shared.module';
import { ActivatedRouteSnapshot } from '@angular/router';

@NgModule({
  imports: [SharedModule, ResourceRootComponent],
  providers: [
    MaximumGuard,
    { provide: ResourceService, useExisting: KvService },
    provideRoutes([
      {
        path: 'create',
        loadComponent: () => import('./pages/kv-create/kv-create.page'),
        canActivate: [MaximumGuard],
        pathMatch: 'full'
      },
      {
        path: ':id',
        loadComponent: () => import('./kv-root.component'),
        resolve: { kv: (route: ActivatedRouteSnapshot) => inject(KvService).resolve(route) },
        canActivate: [UUIDGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/kv-overview/kv-overview.page')
          },
          {
            path: '**',
            redirectTo: ''
          }
        ]
      },
      {
        path: '**',
        redirectTo: 'create'
      }
    ])
  ]
})
export default class KvModule {}
