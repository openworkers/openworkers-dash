import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
import { EMPTY, mergeMap, Observable } from 'rxjs';
import { AuthService } from '~/services/auth.service';

export const BypassAuthInterceptor = new HttpContextToken(() => false);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.context.get(BypassAuthInterceptor)) {
      return next.handle(request);
    }

    // Refresh token if expired
    if (this.authService.accessTokenExpired()) {
      return this.authService
        .refreshTokens()
        .pipe(mergeMap((success) => (success ? this.intercept(request, next) : EMPTY)));
    }

    return next.handle(request);
  }
}
