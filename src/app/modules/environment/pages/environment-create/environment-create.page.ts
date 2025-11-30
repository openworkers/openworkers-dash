
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { visibleBlockValidator, visibleValidator } from '~/app/utils/validators';
import { EnvironmentsService } from '~/services/environments.service';

@Component({
  imports: [ReactiveFormsModule, FormErrorComponent],
  selector: 'app-environment-create',
  templateUrl: './environment-create.page.html'
})
export default class EnvironmentCreatePage {
  public readonly form: FormGroup;

  constructor(private readonly envs: EnvironmentsService, private router: Router) {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, visibleValidator, Validators.maxLength(255)]),
      desc: new FormControl('', [visibleBlockValidator, Validators.maxLength(255)])
    });
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { name, desc } = this.form.value;

    const env = await firstValueFrom(this.envs.create({ name, ...(desc ? { desc } : null) }));

    return await this.router.navigate(['/environment', env.id]).then();
  }
}
