import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AsyncPipe } from '@angular/common';

import { AuthService } from '~/services/auth.service';
import { FormErrorComponent } from '../form-error/form-error.component';

type AuthMode = 'login' | 'register';

@Component({
  imports: [ReactiveFormsModule, FormErrorComponent, RouterLink, AsyncPipe],
  templateUrl: './login.page.html'
})
export class LoginPage {
  public readonly domain: string;
  public readonly allowPassword = true;

  public loginForm: FormGroup;
  public registerForm: FormGroup;
  public mode: AuthMode = 'login';

  public readonly error$ = new BehaviorSubject<string | null>(null);
  public readonly success$ = new BehaviorSubject<string | null>(null);
  public readonly loading$ = new BehaviorSubject<boolean>(false);

  constructor(private readonly auth: AuthService) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });

    this.registerForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });

    this.domain = window.location.hostname.split('.').slice(-2).join('.');
  }

  public toggleMode(): void {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    this.error$.next(null);
    this.success$.next(null);
    this.loginForm.reset();
    this.registerForm.reset();
  }

  public async submitLogin(): Promise<void> {
    this.error$.next(null);

    if (this.loginForm.invalid) {
      return;
    }

    this.loading$.next(true);
    const { email, password } = this.loginForm.value;

    const ok = await firstValueFrom(this.auth.login(email, password));
    this.loading$.next(false);

    if (!ok) {
      this.error$.next('Invalid email or password');
      return;
    }

    // Hard reload to clear in-memory caches from previous session
    window.location.href = '/workers';
  }

  public async submitRegister(): Promise<void> {
    this.error$.next(null);
    this.success$.next(null);

    if (this.registerForm.invalid) {
      return;
    }

    this.loading$.next(true);
    const { email } = this.registerForm.value;

    const result = await firstValueFrom(this.auth.register(email));
    this.loading$.next(false);

    if (result.success) {
      this.success$.next(result.message || 'Check your email to set your password.');
      this.registerForm.reset();
    } else {
      this.error$.next(result.message || 'Registration failed');
    }
  }
}
