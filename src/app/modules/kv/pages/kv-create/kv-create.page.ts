import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { visibleBlockValidator } from '~/app/utils/validators';
import { KvService } from '~/services/kv.service';
import { SharedModule } from '~/app/shared/shared.module';

@Component({
  standalone: true,
  imports: [SharedModule, FormErrorComponent],
  templateUrl: './kv-create.page.html'
})
export default class KvCreatePage {
  public readonly form: FormGroup;

  constructor(
    private readonly kvService: KvService,
    private router: Router
  ) {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      desc: new FormControl('', [visibleBlockValidator, Validators.maxLength(255)])
    });
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { name, desc } = this.form.value;

    const kv = await firstValueFrom(this.kvService.create({ name, desc: desc || undefined }));

    await this.router.navigate(['/kv', kv.id]);
  }
}
