
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { WorkersService } from '~/app/services/workers.service';
import { SharedModule } from '~/app/shared/shared.module';
import { kebabCaseValidator, visibleBlockValidator } from '~/app/utils/validators';

@Component({
  standalone: true,
  imports: [SharedModule, FormErrorComponent],
  templateUrl: './worker-create.page.html'
})
export default class WorkerCreatePage {
  public readonly form: FormGroup;

  public errorMessage?: string;

  constructor(
    private readonly workers: WorkersService,
    private readonly router: Router
  ) {
    this.form = new FormGroup({
      name: new FormControl('', {
        validators: [Validators.required, kebabCaseValidator, Validators.minLength(3), Validators.maxLength(255)],
        asyncValidators: [this.workers.nameExistsValidator()]
      }),
      desc: new FormControl('', [visibleBlockValidator, Validators.maxLength(255)]),
      language: new FormControl('typescript', [Validators.required])
    });
  }

  public submitForm() {
    if (this.form.invalid) {
      return;
    }

    const { name, desc, language } = this.form.value;

    firstValueFrom(this.workers.create({ name, language, ...(desc ? { desc } : null) }))
      .then((worker) => this.router.navigate(['/worker', worker.id]))
      .catch((err) => {
        console.error(err);

        if (err.message.includes('unique')) {
          this.errorMessage = 'Worker name is already taken';
        }
      });
  }
}
