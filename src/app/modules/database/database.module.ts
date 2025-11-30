import { inject, NgModule } from '@angular/core';
import { provideRoutes } from '~/app/utils/router';
import { MaximumGuard } from '~/app/guards/maximum.guard';
import { UUIDGuard } from '~/app/guards/uuid.guard';
import { DatabasesService } from '~/app/services/databases.service';
import { ResourceService } from '~/app/services/resource.service';
import { ResourceRootComponent } from '~/app/shared/resource-root/resource-root.component';
import { SharedModule } from '~/app/shared/shared.module';
import { ActivatedRouteSnapshot } from '@angular/router';

@NgModule({
  imports: [SharedModule, ResourceRootComponent],
  providers: [
    MaximumGuard,
    { provide: ResourceService, useExisting: DatabasesService },
    provideRoutes([
      {
        path: 'create',
        loadComponent: () => import('./pages/database-create/database-create.page'),
        canActivate: [MaximumGuard],
        pathMatch: 'full'
      },
      {
        path: ':id',
        loadComponent: () => import('./database-root.component'),
        resolve: { database: (route: ActivatedRouteSnapshot) => inject(DatabasesService).resolve(route) },
        canActivate: [UUIDGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./pages/database-overview/database-overview.page')
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
export default class DatabaseModule {}
