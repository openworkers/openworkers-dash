import { Component, signal } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { visibleBlockValidator } from '~/app/utils/validators';
import { DatabasesService } from '~/services/databases.service';
import { SharedModule } from '~/app/shared/shared.module';

type DatabaseProvider = 'platform' | 'postgres';

@Component({
  standalone: true,
  imports: [SharedModule, FormErrorComponent],
  templateUrl: './database-create.page.html'
})
export default class DatabaseCreatePage {
  public readonly form: FormGroup;
  public readonly provider = signal<DatabaseProvider>('platform');

  constructor(
    private readonly dbs: DatabasesService,
    private router: Router
  ) {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      desc: new FormControl('', [visibleBlockValidator, Validators.maxLength(255)]),
      connectionString: new FormControl('', [Validators.maxLength(500)])
    });
  }

  public setProvider(p: DatabaseProvider): void {
    this.provider.set(p);

    if (p === 'postgres') {
      this.form.get('connectionString')?.setValidators([Validators.required, Validators.maxLength(500)]);
    } else {
      this.form.get('connectionString')?.clearValidators();
    }

    this.form.get('connectionString')?.updateValueAndValidity();
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { name, desc, connectionString } = this.form.value;

    const input: any = {
      name,
      desc: desc || undefined,
      provider: this.provider()
    };

    if (this.provider() === 'postgres') {
      input.connectionString = connectionString;
    }

    const db = await firstValueFrom(this.dbs.create(input));

    await this.router.navigate(['/database', db.id]);
  }
}
