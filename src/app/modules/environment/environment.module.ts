import { inject, NgModule } from '@angular/core';
import { provideRoutes } from '~/app/utils/router';
import { MaximumGuard } from '~/app/guards/maximum.guard';
import { UUIDGuard } from '~/app/guards/uuid.guard';
import { EnvironmentsService } from '~/app/services/environments.service';
import { ResourceService } from '~/app/services/resource.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import { SharedModule } from '~/app/shared/shared.module';
import { ActivatedRouteSnapshot } from '@angular/router';

@NgModule({
  imports: [SharedModule, ResourceRootComponent],
  providers: [
    MaximumGuard,
    { provide: ResourceService, useExisting: EnvironmentsService },
    provideRoutes([
      {
        path: 'create',
        loadComponent: () => import('./pages/environment-create/environment-create.page'),
        canActivate: [MaximumGuard],
        pathMatch: 'full'
      },
      {
        path: ':id',
        loadComponent: () => import('./environment-root.component'),
        resolve: { environment: (route: ActivatedRouteSnapshot) => inject(EnvironmentsService).resolve(route) },
        canActivate: [UUIDGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/environment-overview/environment-overview.page')
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
export default class EnvironmentModule {}
