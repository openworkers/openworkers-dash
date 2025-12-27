import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, firstValueFrom, map, Observable, shareReplay, startWith } from 'rxjs';
import { Resolved } from '~/app/interfaces/resolved';
import { DebugComponent } from '~/app/shared/debug/debug.component';
import { KeyValueComponent } from '~/app/shared/key-value/key-value.component';
import { ModalComponent } from '~/app/shared/modal/modal.component';
import { EnvironmentsService } from '~/services/environments.service';
import { StorageService } from '~/services/storage.service';
import { KvService } from '~/services/kv.service';
import type { IEnvironment, IEnvironmentValueUpdateInput, IStorageConfig, IKvNamespace } from '@openworkers/api-types';

@Component({
  imports: [CommonModule, RouterLink, ReactiveFormsModule, DebugComponent, KeyValueComponent, ModalComponent],
  templateUrl: './environment-overview.page.html'
})
export default class EnvironmentOverviewPage {
  public readonly environment$: Observable<IEnvironment>;
  public readonly storageConfigs$: Observable<IStorageConfig[]>;
  public readonly kvNamespaces$: Observable<IKvNamespace[]>;

  public readonly vm$: Observable<{
    environment: IEnvironment;
    storageConfigs: IStorageConfig[];
    kvNamespaces: IKvNamespace[];
  }>;

  // Modal state
  public showStorageModal = false;
  public showKvModal = false;

  public storageForm = new FormGroup({
    key: new FormControl('', [Validators.required]),
    configId: new FormControl('', [Validators.required]),
    type: new FormControl<'assets' | 'storage'>('assets', [Validators.required])
  });

  public kvForm = new FormGroup({
    key: new FormControl('', [Validators.required]),
    namespaceId: new FormControl('', [Validators.required])
  });

  private environmentId!: string;

  constructor(
    route: ActivatedRoute,
    private envs: EnvironmentsService,
    private storageService: StorageService,
    private kvService: KvService
  ) {
    const env = route.parent?.snapshot.data['environment'] as Resolved<IEnvironment>;
    this.environmentId = env.id;

    // Subscribe to the cached observable to get live updates
    this.environment$ = env.asObservable?.() ?? this.envs.findById(env.id);

    // Load storage configs and kv namespaces as observables
    this.storageConfigs$ = this.storageService.findAll().pipe(
      startWith([] as IStorageConfig[]),
      shareReplay(1)
    );

    this.kvNamespaces$ = this.kvService.findAll().pipe(
      startWith([] as IKvNamespace[]),
      shareReplay(1)
    );

    // Combine all data into a single view model
    this.vm$ = combineLatest([
      this.environment$,
      this.storageConfigs$,
      this.kvNamespaces$
    ]).pipe(
      map(([environment, storageConfigs, kvNamespaces]) => ({
        environment,
        storageConfigs,
        kvNamespaces
      }))
    );
  }

  update(id: string, values: IEnvironmentValueUpdateInput[]) {
    firstValueFrom(this.envs.update({ id, values }));
  }

  openStorageModal() {
    this.storageForm.reset({ type: 'assets' });
    this.showStorageModal = true;
  }

  openKvModal() {
    this.kvForm.reset();
    this.showKvModal = true;
  }

  async addStorageBinding() {
    if (this.storageForm.invalid) return;

    const { key, configId, type } = this.storageForm.value;

    await firstValueFrom(this.envs.update({
      id: this.environmentId,
      values: [{ key: key!, value: configId!, type: type! }]
    }));

    this.showStorageModal = false;
  }

  async addKvBinding() {
    if (this.kvForm.invalid) return;

    const { key, namespaceId } = this.kvForm.value;

    await firstValueFrom(this.envs.update({
      id: this.environmentId,
      values: [{ key: key!, value: namespaceId!, type: 'kv' }]
    }));

    this.showKvModal = false;
  }
}
