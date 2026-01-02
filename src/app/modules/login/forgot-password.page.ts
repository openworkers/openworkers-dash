import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AsyncPipe } from '@angular/common';

import { AuthService } from '~/services/auth.service';
import { FormErrorComponent } from '../form-error/form-error.component';

@Component({
  imports: [ReactiveFormsModule, FormErrorComponent, RouterLink, AsyncPipe],
  template: `
    <div class="flex flex-col h-screen items-center justify-center">
      <div class="max-w-md p-8">
        <h2 class="text-xl font-semibold mb-4">Reset your password</h2>

        @if (!(submitted$ | async)) {
          <p class="text-gray-500 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form [formGroup]="form" (ngSubmit)="submitForm()" class="flex flex-col">
            <div class="flex flex-col mb-4">
              <label class="mb-1 text-sm" for="email">E-mail</label>
              <input
                class="input-outline mb-0"
                type="email"
                formControlName="email"
                placeholder="you@example.com"
                autocomplete="email"
              />
              <span class="text-xs pb-2 text-red">
                <form-error [control]="form.get('email')"></form-error>
              </span>
            </div>

            <button
              class="btn-blue shadow w-full"
              [disabled]="form.invalid || (loading$ | async)"
              type="submit"
            >
              @if (loading$ | async) {
                <span>Sending...</span>
              } @else {
                Send reset link
              }
            </button>
          </form>
        } @else {
          <p class="text-gray-500 mb-6">
            {{ message$ | async }}
          </p>
        }

        <a routerLink="/sign-in" class="text-sm text-blue mt-4 block">
          Back to Sign in
        </a>
      </div>
    </div>
  `
})
export class ForgotPasswordPage {
  public readonly form: FormGroup;
  public readonly loading$ = new BehaviorSubject<boolean>(false);
  public readonly submitted$ = new BehaviorSubject<boolean>(false);
  public readonly message$ = new BehaviorSubject<string>('');

  constructor(private readonly auth: AuthService) {
    this.form = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    this.loading$.next(true);
    const { email } = this.form.value;

    const result = await firstValueFrom(this.auth.forgotPassword(email));
    this.loading$.next(false);
    this.submitted$.next(true);
    this.message$.next(result.message);
  }
}
