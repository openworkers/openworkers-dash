import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AsyncPipe } from '@angular/common';

import { AuthService } from '~/services/auth.service';
import { FormErrorComponent } from '../form-error/form-error.component';

type ResetState = 'form' | 'success' | 'error';

@Component({
  imports: [ReactiveFormsModule, FormErrorComponent, RouterLink, AsyncPipe],
  templateUrl: './reset-password.page.html'
})
export class ResetPasswordPage implements OnInit {
  public readonly form: FormGroup;
  public readonly state$ = new BehaviorSubject<ResetState>('form');
  public readonly loading$ = new BehaviorSubject<boolean>(false);
  public readonly error$ = new BehaviorSubject<string | null>(null);

  private token: string | null = null;

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.form = new FormGroup({
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required])
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'];

    if (!this.token) {
      this.state$.next('error');
    }
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid || !this.token) {
      return;
    }

    const { password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.error$.next('Passwords do not match');
      return;
    }

    this.error$.next(null);
    this.loading$.next(true);

    const success = await firstValueFrom(this.auth.resetPassword(this.token, password));
    this.loading$.next(false);

    if (success) {
      this.state$.next('success');
      setTimeout(() => this.router.navigate(['/workers']), 2000);
    } else {
      this.state$.next('error');
    }
  }
}
