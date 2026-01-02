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
      },
      {
        path: 'set-password',
        loadComponent: () => import('./set-password.page').then((m) => m.SetPasswordPage)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password.page').then((m) => m.ForgotPasswordPage)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./reset-password.page').then((m) => m.ResetPasswordPage)
      }
    ])
  ]
})
export default class LoginModule {}
