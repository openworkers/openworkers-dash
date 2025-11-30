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
import { IconDirective } from '../icon.directive';
import type { IEnvironmentValueUpdateInput } from '@openworkers/api-types';

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

interface KVS<K = string, V = string, S = boolean> {
  key: K;
  value: V;
  secret: S;
}

type KVSId = KVS & { id: string };

type KVSControl = KVS<SmartControl<string>, SmartControl<string>, SmartControl<boolean>>;

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
    return this.deleted || this.controls.key.changed || this.controls.value.changed || this.controls.secret.changed;
  }

  get created() {
    return this.controls.key.defaultValue === emptyString;
  }
}

@Component({
  imports: [CommonModule, IconDirective, ReactiveFormsModule],
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

    group.controls.secret = new SmartControl<boolean>(false);
    group.controls.secret.markAsChanged();
  }

  private createKVFormGroup({ id, key, value, secret }: Partial<KVSId> = {}) {
    const group = new KVSFormGroup({
      key: new SmartControl<string | null>(key ?? ''),
      value: new SmartControl<string | null>(value ?? ''),
      secret: new SmartControl<boolean>(secret ?? false)
    });

    if (id) {
      this.ids.set(group, id);
    }

    return group;
  }

  onSubmit() {
    // const deleted = this.form.controls.filter((group) => group.deleted);
    const changed = this.form.controls.filter((group) => group.changed);
    // const created = this.form.controls.filter((group) => group.created);

    const values = changed.map((group) => {
      if (group.created) {
        return group.value as KVS;
      }

      const id = !group.created && this.ids.get(group);

      const { key, value, secret } = group.controls;

      if (group.deleted) {
        return { id, value: null };
      }

      const update = {
        id,
        ...(key.changed ? { key: key.value } : null),
        ...(value.changed ? { value: value.value } : null),
        ...(secret.changed ? { secret: secret.value } : null)
      };

      return update;
    });

    this.update.emit(values as IEnvironmentValueUpdateInput[]);
  }
}
