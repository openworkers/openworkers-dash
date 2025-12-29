import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorComponent } from '~/app/modules/form-error/form-error.component';
import { visibleBlockValidator } from '~/app/utils/validators';
import { StorageService } from '~/services/storage.service';
import { SharedModule } from '~/app/shared/shared.module';
import type { IStorageConfigCreateInput } from '@openworkers/api-types';

@Component({
  standalone: true,
  imports: [SharedModule, FormErrorComponent],
  templateUrl: './storage-create.page.html'
})
export default class StorageCreatePage {
  public readonly form: FormGroup;

  constructor(
    private readonly storageService: StorageService,
    private router: Router
  ) {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(100)]),
      desc: new FormControl('', [visibleBlockValidator, Validators.maxLength(255)]),
      provider: new FormControl<'platform' | 's3'>('platform', [Validators.required]),
      // S3 provider fields
      bucket: new FormControl(''),
      prefix: new FormControl(''),
      accessKeyId: new FormControl(''),
      secretAccessKey: new FormControl(''),
      endpoint: new FormControl(''),
      region: new FormControl(''),
      publicUrl: new FormControl('')
    });

    // Update validators when provider changes
    this.form.get('provider')?.valueChanges.subscribe((provider) => {
      const s3Fields = ['bucket', 'accessKeyId', 'secretAccessKey'];

      if (provider === 's3') {
        s3Fields.forEach((field) => {
          this.form.get(field)?.setValidators([Validators.required]);
          this.form.get(field)?.updateValueAndValidity();
        });
      } else {
        s3Fields.forEach((field) => {
          this.form.get(field)?.clearValidators();
          this.form.get(field)?.updateValueAndValidity();
        });
      }
    });
  }

  public get isS3Provider(): boolean {
    return this.form.get('provider')?.value === 's3';
  }

  public async submitForm(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const { name, desc, provider, bucket, prefix, accessKeyId, secretAccessKey, endpoint, region, publicUrl } =
      this.form.value;

    let input: IStorageConfigCreateInput;

    if (provider === 'platform') {
      input = { name, desc: desc || undefined, provider: 'platform' };
    } else {
      input = {
        name,
        desc: desc || undefined,
        provider: 's3',
        bucket,
        prefix: prefix || undefined,
        accessKeyId,
        secretAccessKey,
        endpoint: endpoint || undefined,
        region: region || undefined,
        publicUrl: publicUrl || undefined
      };
    }

    const storage = await firstValueFrom(this.storageService.create(input));

    await this.router.navigate(['/storage', storage.id]);
  }
}
