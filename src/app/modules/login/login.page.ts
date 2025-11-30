
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { visibleValidator } from '~/app/utils/validators';
import { AuthService } from '~/services/auth.service';
import { FormErrorComponent } from '../form-error/form-error.component';

@Component({
  imports: [ReactiveFormsModule, FormErrorComponent],
  templateUrl: './login.page.html'
})
export class LoginPage {
  public readonly domain: string;
  public readonly form: FormGroup;
  public readonly allowPassword = false;
  public error = false;

  constructor(private readonly auth: AuthService, private router: Router) {
    this.form = new FormGroup({
      username: new FormControl('', [Validators.required, visibleValidator]),
      password: new FormControl('', [Validators.required, visibleValidator])
    });

    this.domain = window.location.hostname.split('.').slice(-2).join('.');
  }

  public async submitForm(): Promise<any> {
    this.error = false;

    if (this.form.invalid) {
      return;
    }

    const { username, password } = this.form.value;
    const ok = await firstValueFrom(this.auth.login(username, password));

    if (!ok) {
      this.error = !ok;
      return;
    }

    return this.router.navigate(['/workers']);
  }
}
