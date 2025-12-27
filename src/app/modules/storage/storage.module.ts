import { inject, NgModule } from '@angular/core';
import { provideRoutes } from '~/app/utils/router';
import { MaximumGuard } from '~/app/guards/maximum.guard';
import { UUIDGuard } from '~/app/guards/uuid.guard';
import { StorageService } from '~/app/services/storage.service';
import { ResourceService } from '~/app/services/resource.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import { SharedModule } from '~/app/shared/shared.module';
import { ActivatedRouteSnapshot } from '@angular/router';

@NgModule({
  imports: [SharedModule, ResourceRootComponent],
  providers: [
    MaximumGuard,
    { provide: ResourceService, useExisting: StorageService },
    provideRoutes([
      {
        path: 'create',
        loadComponent: () => import('./pages/storage-create/storage-create.page'),
        canActivate: [MaximumGuard],
        pathMatch: 'full'
      },
      {
        path: ':id',
        loadComponent: () => import('./storage-root.component'),
        resolve: { storage: (route: ActivatedRouteSnapshot) => inject(StorageService).resolve(route) },
        canActivate: [UUIDGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/storage-overview/storage-overview.page')
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
export default class StorageModule {}
