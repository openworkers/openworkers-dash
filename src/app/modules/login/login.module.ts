import { NgModule } from '@angular/core';
import { provideRoutes } from '~/app/utils/router';

@NgModule({
  providers: [
    provideRoutes([
      {
        path: '',
        loadComponent: () => import('./login.page').then((m) => m.LoginPage)
      },
      {
        path: 'callback/github',
        loadComponent: () => import('./callback.page').then((m) => m.CallbackPage)
      }
    ])
  ]
})
export default class LoginModule {}
