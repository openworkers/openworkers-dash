import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChange } from '@angular/core';
import { AbstractControl, FormArray, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { SharedModule } from '~/app/shared/shared.module';
import { domainNameValidator } from '~/app/utils/validators';
import type { IDomain } from '@openworkers/api-types';

const emptyString = '';

// Validator to check duplicate element in FormArray
export function duplicateKeyValidator(control: AbstractControl): ValidationErrors | null {
  if (!(control instanceof SmartFormArray)) {
    console.warn('duplicateKeyValidator can only be used on SmartFormArray');
    return null;
  }

  const values = control.controls.map((c) => c.value);
  const duplicateKey = values.find((value, index) => values.indexOf(value) !== index) ?? null;
  return duplicateKey ? { duplicateKey } : null;
}

class DomainControl extends FormControl<string | null> {
  public deleted = false;
  public created = false;

  constructor(value: string, options?: { disabled: boolean }) {
    super(value, { nonNullable: true, validators: [Validators.maxLength(255), domainNameValidator] });

    if (options?.disabled) {
      this.disable({ onlySelf: true });
    }
  }

  get changed() {
    return this.created || this.deleted || this.value !== this.defaultValue;
  }

  markAsCreated() {
    this.created = true;
  }

  rollbackDelete() {
    this.deleted = false;
  }

  markAsDeleted() {
    this.deleted = true;
    this.markAsTouched();
    this.markAsDirty();
    this.disable({ onlySelf: true });
  }
}

class SmartFormArray extends FormArray<DomainControl> {
  constructor(controls: DomainControl[]) {
    super(controls, duplicateKeyValidator);
  }

  get changed() {
    return this.controls.some((control) => control.changed);
  }

  public deleteAt(index: number) {
    const control = this.at(index);
    if (control.defaultValue === emptyString) {
      this.removeAt(index);
      this.markAsTouched();
    } else {
      control.markAsDeleted();
    }
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule],
  selector: 'app-domains',
  templateUrl: 'domains.component.html',
  styleUrls: ['domains.component.css']
})
export class DomainsComponent implements OnChanges {
  public form!: SmartFormArray;
  public ids = new WeakMap<AbstractControl, string>();

  /**
   * Current array value
   */
  @Input()
  public domains!: readonly Pick<IDomain, 'name'>[];

  /**
   * Updated dictionary value
   */
  @Output()
  public readonly update: EventEmitter<string[]> = new EventEmitter();

  private initialValues: string[] = [];

  resetForm() {
    const values = this.initialValues ?? [];

    this.form = new SmartFormArray(values.map((value) => new DomainControl(value, { disabled: true })));
  }

  ngOnChanges(changes: { domains?: SimpleChange }) {
    if (changes.domains) {
      const values = changes.domains.currentValue as IDomain[];

      console.log('DomainsComponent ngOnChanges', values);

      this.initialValues = values.map((value) => value.name);
      this.resetForm();
    }
  }

  addValue() {
    const newControl = new DomainControl(emptyString);
    this.form.push(newControl);
    this.form.markAsTouched();
  }

  onSubmit() {
    const values = this.form.controls
      .filter((control) => !control.deleted)
      .map((control) => control.value)
      .filter((value): value is string => !!value);

    this.form.markAsPending();

    this.update.emit(values);
  }
}
