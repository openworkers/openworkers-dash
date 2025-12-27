import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '~/services/auth.service';
import type { ISelf } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h3 class="title">Account</h3>

      <div>
        @if (user$ | async; as user) {
          <div class="mt-4">
            <div class="text-gray-500">Username:</div>
            <div class="text-gray-900 dark:text-stone-200 ml-2">{{ user.username }}</div>
          </div>
          <div class="mt-4">
            <div class="text-gray-500">Resources limits:</div>
            <ul class="text-gray-900 dark:text-stone-200 ml-2">
              <li>Workers: {{ user.limits.workers }}</li>
              <li>Environments: {{ user.limits.environments }}</li>
              <li>Databases: {{ user.limits.databases }}</li>
              <li>KV Namespaces: {{ user.limits.kv }}</li>
            </ul>
          </div>
        }
      </div>

      <div class="mt-8">
        <button class="btn-outline" (click)="logout()">Logout</button>
      </div>
    </div>
  `
})
export default class AccountPage {
  user$: Observable<ISelf | null>;

  constructor(
    private router: Router,
    private auth: AuthService
  ) {
    this.user$ = auth.user$;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }
}
