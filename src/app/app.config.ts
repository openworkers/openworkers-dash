import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';

import { AuthService } from '~/services/auth.service';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { CronService } from '~/services/cron.service';

import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { ThemeService } from './services/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => inject(CronService).init()),
    provideAppInitializer(() => inject(AuthService).init()),
    provideAppInitializer(() => void inject(ThemeService)),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptorsFromDi())
  ]
};
