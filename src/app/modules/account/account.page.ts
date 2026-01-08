import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, of } from 'rxjs';
import { AuthService } from '~/services/auth.service';
import { ApiKeysService } from '~/services/api-keys.service';
import { AiService } from '~/services/ai.service';
import type { ISelf, IApiKey } from '@openworkers/api-types';

const CLAUDE_TOKEN_KEY = 'claude_token';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.page.html'
})
export default class AccountPage implements OnInit {
  user$: Observable<ISelf | null>;
  keys$: Observable<IApiKey[]>;
  creating$ = new BehaviorSubject<boolean>(false);

  showCreateKey = false;
  newKeyName = '';
  newKeyToken: string | null = null;

  // Claude token
  claudeToken = '';
  claudeTokenSaved$ = new BehaviorSubject<boolean>(false);
  claudeTokenTesting$ = new BehaviorSubject<boolean>(false);
  claudeTokenError$ = new BehaviorSubject<string>('');

  constructor(
    private router: Router,
    private auth: AuthService,
    private apiKeys: ApiKeysService,
    private ai: AiService
  ) {
    this.user$ = auth.user$;
    this.keys$ = apiKeys.keys$;
    this.loadClaudeToken();
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

  // Claude token methods
  private loadClaudeToken() {
    const token = localStorage.getItem(CLAUDE_TOKEN_KEY);

    if (token) {
      this.claudeToken = token;
      this.claudeTokenSaved$.next(true);
    }
  }

  saveClaudeToken() {
    if (!this.claudeToken) return;

    this.claudeTokenTesting$.next(true);
    this.claudeTokenError$.next('');

    this.ai
      .testToken(this.claudeToken)
      .pipe(
        catchError((err) => {
          const error = err?.error?.error || 'Invalid token';
          return of({ valid: false, error });
        })
      )
      .subscribe((result) => {
        this.claudeTokenTesting$.next(false);

        if (result.valid) {
          localStorage.setItem(CLAUDE_TOKEN_KEY, this.claudeToken);
          this.claudeTokenSaved$.next(true);
        } else {
          this.claudeTokenError$.next(result.error || 'Invalid token');
        }
      });
  }

  clearClaudeToken() {
    localStorage.removeItem(CLAUDE_TOKEN_KEY);
    this.claudeToken = '';
    this.claudeTokenSaved$.next(false);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/sign-in']);
  }
}
