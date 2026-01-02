import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import type {
  IEnvironmentValueUpdateInput,
  IStorageConfig,
  IKvNamespace,
  IDatabase,
  IWorker
} from '@openworkers/api-types';

const emptyString = '';

// Validator to check duplicate element in FormArray
export function duplicateKeyValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof KVSFormArray)) {
    console.warn('duplicateKeyValidator can only be used on KVSFormArray');
    return null;
  }

  const values = control.controls.map((c: KVSFormGroup) => c.value.key as string);
  const duplicateKey = values.find((value, index) => values.indexOf(value) !== index) ?? null;
  return duplicateKey ? { duplicateKey } : null;
}

type BindingType = 'var' | 'secret' | 'assets' | 'storage' | 'kv' | 'database' | 'worker';

const RESOURCE_BINDINGS: BindingType[] = ['assets', 'storage', 'kv', 'database', 'worker'];

interface KVS<K = string, V = string, T = BindingType> {
  key: K;
  value: V;
  type: T;
}

type KVSId = KVS & { id: string };

type KVSControl = KVS<SmartControl<string>, SmartControl<string>, SmartControl<BindingType>>;

class SmartControl<T extends string | number | boolean | null> extends FormControl {
  private markedAsChanged = false;

  constructor(value: T) {
    super(value, { nonNullable: true });
  }

  get changed() {
    return this.markedAsChanged || this.value !== this.defaultValue;
  }

  markAsChanged() {
    this.markedAsChanged = true;
  }
}

class KVSFormArray extends FormArray<KVSFormGroup> {
  constructor(controls: KVSFormGroup[]) {
    super(controls, duplicateKeyValidator);
  }

  get changed() {
    return this.controls.some((control) => control.changed);
  }

  public deleteAt(index: number) {
    const control = this.at(index);
    if (control.controls.key.defaultValue === emptyString) {
      this.removeAt(index);
      this.markAsTouched();
    } else {
      control.markAsDeleted();
    }
  }
}

class KVSFormGroup extends FormGroup<KVSControl> {
  public deleted = false;

  markAsDeleted() {
    this.deleted = true;
    this.markAsTouched();
    this.markAsDirty();
    this.disable({ onlySelf: true });
  }

  rollbackDelete() {
    const controls = Object.values(this.controls);

    this.deleted = false;

    this.enable({ onlySelf: true, emitEvent: false });

    // If all controls are pristine, mark the group as pristine
    if (!controls.some((control) => control.dirty)) {
      this.markAsPristine();
    }

    // If all controls are untouched, mark the group as untouched
    if (!controls.some((control) => control.touched)) {
      this.markAsUntouched();
    }
  }

  get changed() {
    return this.deleted || this.controls.key.changed || this.controls.value.changed || this.controls.type.changed;
  }

  get created() {
    return this.controls.key.defaultValue === emptyString;
  }

  get isBinding() {
    return RESOURCE_BINDINGS.includes(this.controls.type.value as BindingType);
  }
}

@Component({
  imports: [CommonModule, NgIconComponent, ReactiveFormsModule, RouterLink],
  selector: 'app-key-value',
  templateUrl: 'key-value.component.html',
  styleUrls: ['key-value.component.css']
})
export class KeyValueComponent implements OnChanges {
  public form!: KVSFormArray;
  public ids = new WeakMap<AbstractControl, string>();

  /**
   * Current dictionary value
   */
  @Input()
  public kv!: readonly KVSId[];

  /**
   * Updated dictionary value
   */
  @Output()
  public readonly update: EventEmitter<IEnvironmentValueUpdateInput[]> = new EventEmitter();

  /**
   * Request to add a storage binding
   */
  @Output()
  public readonly addStorage: EventEmitter<void> = new EventEmitter();

  /**
   * Request to add a KV binding
   */
  @Output()
  public readonly addKv: EventEmitter<void> = new EventEmitter();

  /**
   * Request to add a Database binding
   */
  @Output()
  public readonly addDatabase: EventEmitter<void> = new EventEmitter();

  /**
   * Request to add a Worker binding
   */
  @Output()
  public readonly addWorker: EventEmitter<void> = new EventEmitter();

  /**
   * Storage configs for resolving binding names
   */
  @Input()
  public storageConfigs: IStorageConfig[] = [];

  /**
   * KV namespaces for resolving binding names
   */
  @Input()
  public kvNamespaces: IKvNamespace[] = [];

  /**
   * Databases for resolving binding names
   */
  @Input()
  public databases: IDatabase[] = [];

  /**
   * Workers for resolving binding names
   */
  @Input()
  public workers: IWorker[] = [];

  private initialValues: KVSId[] = [];

  resetForm() {
    this.initForm(this.initialValues);
  }

  private initForm(values: KVSId[]) {
    if (!values.length) {
      this.form = new KVSFormArray([this.createKVFormGroup()]);
    } else {
      this.form = new KVSFormArray(values.map((value) => this.createKVFormGroup(value)));
    }
  }

  ngOnChanges(changes: { kv?: SimpleChange }) {
    if (changes.kv) {
      const values = changes.kv.currentValue as KVSId[];
      this.initialValues = values;
      this.initForm(values);
    }
  }

  addKeyValue() {
    this.form.push(this.createKVFormGroup());
    this.form.markAsTouched();
  }

  resetSecret(group: KVSFormGroup, event: Event) {
    event.preventDefault();

    const ok = confirm('Are you sure you want to reset secret?');
    if (!ok) {
      return;
    }

    group.controls.value.setValue(null);
    group.controls.value.markAsDirty();
    group.controls.value.markAllAsTouched();

    group.controls.type = new SmartControl<BindingType>('var');
    group.controls.type.markAsChanged();
  }

  private createKVFormGroup({ id, key, value, type }: Partial<KVSId> = {}) {
    const group = new KVSFormGroup({
      key: new SmartControl<string | null>(key ?? ''),
      value: new SmartControl<string | null>(value ?? ''),
      type: new SmartControl<BindingType>(type ?? 'var')
    });

    if (id) {
      this.ids.set(group, id);
    }

    return group;
  }

  getBindingLink(group: KVSFormGroup): string[] | null {
    const type = group.controls.type.value;
    const value = group.controls.value.value;

    if (!value) return null;

    switch (type) {
      case 'assets':
      case 'storage':
        return ['/storage', value];
      case 'kv':
        return ['/kv', value];
      case 'database':
        return ['/database', value];
      case 'worker':
        return ['/worker', value];
      default:
        return null;
    }
  }

  getBindingDisplayName(group: KVSFormGroup): string {
    const type = group.controls.type.value;
    const value = group.controls.value.value;

    if (!value) return type;

    let name: string | undefined;

    switch (type) {
      case 'assets':
      case 'storage':
        name = this.storageConfigs.find((c) => c.id === value)?.name;
        break;
      case 'kv':
        name = this.kvNamespaces.find((ns) => ns.id === value)?.name;
        break;
      case 'database':
        name = this.databases.find((db) => db.id === value)?.name;
        break;
      case 'worker':
        name = this.workers.find((w) => w.id === value)?.name;
        break;
    }

    return name ? `${name} (${type})` : type;
  }

  onSubmit() {
    const changed = this.form.controls.filter((group) => group.changed);

    const values = changed.map((group) => {
      if (group.created) {
        return group.value as KVS;
      }

      const id = !group.created && this.ids.get(group);
      const { key, value, type } = group.controls;

      if (group.deleted) {
        return { id, value: null };
      }

      return {
        id,
        ...(key.changed ? { key: key.value } : null),
        ...(value.changed ? { value: value.value } : null),
        ...(type.changed ? { type: type.value } : null)
      };
    });

    this.update.emit(values as IEnvironmentValueUpdateInput[]);
  }
}
