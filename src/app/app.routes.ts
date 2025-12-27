import { Routes } from '@angular/router';
import { LoggedAuthGuard, NotLoggedAuthGuard } from './guards/auth.guard';
import { inject } from '@angular/core';
import { WorkersService } from './services/workers.service';
import { EnvironmentsService } from './services/environments.service';
import { DatabasesService } from './services/databases.service';
import { KvService } from './services/kv.service';

export const routes: Routes = [
  {
    path: 'account',
    data: { menuActive: 'account' },
    loadComponent: () => import('~/modules/account/account.page'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'workers',
    resolve: { resourceList: () => inject(WorkersService).findAll() },
    data: { menuActive: 'workers', resourceName: 'worker' },
    loadComponent: () => import('~/modules/resource-list/resource-list.page'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'environments',
    resolve: { resourceList: () => inject(EnvironmentsService).findAll() },
    data: { menuActive: 'environments', resourceName: 'environment' },
    loadComponent: () => import('~/modules/resource-list/resource-list.page'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'databases',
    resolve: { resourceList: () => inject(DatabasesService).findAll() },
    data: { menuActive: 'databases', resourceName: 'database' },
    loadComponent: () => import('~/modules/resource-list/resource-list.page'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  { path: 'login', redirectTo: '/sign-in' },
  {
    path: 'sign-in',
    data: { menuActive: null },
    loadChildren: () => import('~/modules/login/login.module'),
    canLoad: [NotLoggedAuthGuard],
    canActivate: [NotLoggedAuthGuard]
  },
  {
    path: 'worker',
    data: { menuActive: 'workers' },
    loadChildren: () => import('~/modules/worker/worker.module'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'environment',
    data: { menuActive: 'environments' },
    loadChildren: () => import('~/modules/environment/environment.module'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'database',
    data: { menuActive: 'databases' },
    loadChildren: () => import('~/modules/database/database.module'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'kv-namespaces',
    resolve: { resourceList: () => inject(KvService).findAll() },
    data: { menuActive: 'kv', resourceName: 'kv' },
    loadComponent: () => import('~/modules/resource-list/resource-list.page'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: 'kv',
    data: { menuActive: 'kv' },
    loadChildren: () => import('~/modules/kv/kv.module'),
    canLoad: [LoggedAuthGuard],
    canActivate: [LoggedAuthGuard]
  },
  {
    path: '**',
    redirectTo: '/sign-in'
  }
];
