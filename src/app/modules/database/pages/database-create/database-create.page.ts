import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { visibleBlockValidator } from '~/app/utils/validators';
import { DatabasesService } from '~/services/databases.service';
import { SharedModule } from '~/app/shared/shared.module';

@Component({
  standalone: true,
  imports: [SharedModule, FormErrorComponent],
  templateUrl: './database-create.page.html'
})
export default class DatabaseCreatePage {
  public readonly form: FormGroup;

  constructor(
    private readonly dbs: DatabasesService,
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

    const db = await firstValueFrom(this.dbs.create({ name, desc: desc || null }));

    // Navigate to database edit page to generate token
    await this.router.navigate(['/database', db.id]);
  }
}
