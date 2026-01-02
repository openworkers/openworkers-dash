import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '~/services/auth.service';
import { ApiKeysService, type ApiKey } from '~/services/api-keys.service';
import type { ISelf } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.page.html'
})
export default class AccountPage implements OnInit {
  user$: Observable<ISelf | null>;
  keys$: Observable<ApiKey[]>;
  creating$ = new BehaviorSubject<boolean>(false);

  showCreateKey = false;
  newKeyName = '';
  newKeyToken: string | null = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    private apiKeys: ApiKeysService
  ) {
    this.user$ = auth.user$;
    this.keys$ = apiKeys.keys$;
  }

  ngOnInit() {
    this.apiKeys.loadKeys().subscribe();
  }

  createKey() {
    if (!this.newKeyName) return;

    this.creating$.next(true);
    this.apiKeys.createKey(this.newKeyName).subscribe({
      next: (key) => {
        this.newKeyToken = key.token;
        this.showCreateKey = false;
        this.newKeyName = '';
        this.creating$.next(false);
      },
      error: () => {
        this.creating$.next(false);
      }
    });
  }

  cancelCreate() {
    this.showCreateKey = false;
    this.newKeyName = '';
  }

  copyToken() {
    if (this.newKeyToken) {
      navigator.clipboard.writeText(this.newKeyToken);
    }
  }

  deleteKey(id: string) {
    if (confirm('Are you sure you want to delete this API key?')) {
      this.apiKeys.deleteKey(id).subscribe();
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }
}
