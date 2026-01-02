import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '~/services/auth.service';
import { firstValueFrom, forkJoin, timer } from 'rxjs';
import { logger } from '~/logger';

const log = logger.getLogger('CallbackPage');

@Component({
  imports: [RouterLink],
  template: `
    <div class="page text-center">
      @if (!error) {
        <img class="mx-auto w-96 mt-32 mb-16" src="/assets/github-mark.svg" />
        <h4>Loading your Github profile ...</h4>
      } @else {
        <h4 class="text-red">
          {{ error }}
        </h4>
        <div class="pt-8">
          <a class="btn-light" routerLink="/sign-in">Back to login page</a>
        </div>
      }
    </div>
  `
})
export class CallbackPage {
  public error: string | null = null;

  constructor(auth: AuthService, route: ActivatedRoute, router: Router) {
    const error = route.snapshot.queryParamMap.get('error');
    switch (error) {
      case 'access_denied':
        router.navigate(['/sign-in']);
        return;
      default:
        this.error = route.snapshot.queryParamMap.get('error_description');
        return;
      case null:
    }

    const code = route.snapshot.queryParamMap.get('code');
    if (!code) {
      this.error = 'Invalid callback parameters: missing code';
      return;
    }

    router
      .navigate([], { relativeTo: route }) // Clear query params
      .then(() => firstValueFrom(forkJoin([auth.forwardGithubCode(code), timer(1500)])))
      .then(() => router.navigate(['/workers']))
      .catch((err) => {
        log.error('Callback error:', err);
        this.error = `An error happened: ${err.message || 'unknown error'}`;
        throw err;
      });
  }
}
