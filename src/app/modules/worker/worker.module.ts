import { inject, NgModule } from '@angular/core';
import { provideRoutes } from '~/app/utils/router';
import { WorkerRootComponent } from './worker-root.component';
import { SharedModule } from '~/app/shared/shared.module';
import { UUIDGuard } from '~/app/guards/uuid.guard';
import { ResourceService } from '~/app/services/resource.service';
import { WorkersService } from '~/app/services/workers.service';
import { MaximumGuard } from '~/app/guards/maximum.guard';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import { ActivatedRouteSnapshot } from '@angular/router';

@NgModule({
  imports: [SharedModule, ResourceRootComponent],
  providers: [
    MaximumGuard,
    { provide: ResourceService, useExisting: WorkersService },
    provideRoutes([
      {
        path: 'create',
        loadComponent: () => import('./pages/worker-create/worker-create.page'),
        canActivate: [MaximumGuard],
        pathMatch: 'full'
      },
      // Editor is not child of WorkerRootComponent because it needs to be full page
      {
        path: ':id/edit',
        resolve: { worker: (route: ActivatedRouteSnapshot) => inject(WorkersService).resolve(route) },
        canActivate: [UUIDGuard],
        loadComponent: () => import('./pages/worker-edit/worker-edit.page')
      },
      {
        path: ':id',
        component: WorkerRootComponent,
        resolve: { worker: (route: ActivatedRouteSnapshot) => inject(WorkersService).resolve(route) },
        canActivate: [UUIDGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () => import('./pages/worker-overview/worker-overview.page')
          },
          {
            path: 'logs',
            loadComponent: () => import('./pages/worker-logs/worker-logs.page')
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
export default class WorkerModule {}
