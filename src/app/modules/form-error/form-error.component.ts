
import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

enum ErrorName {
  Required = 'required',
  Email = 'email',
  Min = 'min',
  Max = 'max',
  MinLength = 'minlength',
  MaxLength = 'maxlength',
  Visible = 'visible',
  VisibleBlock = 'visibleBlock',
  KebabCase = 'kebabCase',
  NameExists = 'nameExists'
}

interface LengthError {
  name: ErrorName.MinLength | ErrorName.MaxLength;
  requiredLength: number;
  actualLength: number;
}

interface MinError {
  name: ErrorName.Min;
  min: number;
  actual: number;
}

interface MaxError {
  name: ErrorName.Max;
  max: number;
  actual: number;
}

type GenericError<D = any> = D & { name: ErrorName };

type Error = MaxError | MinError | LengthError | GenericError;

@Component({
  imports: [],
  selector: 'form-error',
  template: `
    @if (control && control.errors && control.touched) {
      @for (error of errors; track error) {
        <div>
          @if (error.name === ErrorName.Required) {
            This field is required
          }
          @if (error.name === ErrorName.Email) {
            This field must be a valid email
          }
          @if (error.name === ErrorName.Min) {
            This field must be at least {{ error.min }}
          }
          @if (error.name === ErrorName.Max) {
            This field must be at most {{ error.max }}
          }
          @if (error.name === ErrorName.MinLength) {
            This field must be at least {{ error.requiredLength }} characters
          }
          @if (error.name === ErrorName.MaxLength) {
            This field must be at most {{ error.requiredLength }} characters
          }
          @if (error.name === ErrorName.Visible) {
            This field must not contain invisible characters or newlines
          }
          @if (error.name === ErrorName.VisibleBlock) {
            This field must not contain invisible characters
          }
          @if (error.name === ErrorName.KebabCase) {
            This field must be a valid kebab-case string (e.g. "my-worker")
          }
          @if (error.name === ErrorName.NameExists) {
            Name already taken
          }
        </div>
      }
    }
    `,
  styles: []
})
export class FormErrorComponent {
  public readonly ErrorName = ErrorName;

  @Input()
  control: AbstractControl | null = null;

  public get errors(): Error[] | null {
    const errs = this.control?.errors;
    if (!errs) {
      return null;
    }

    // Display only required error if present
    if (errs['required']) {
      return [{ name: ErrorName.Required }];
    }

    return errs && Object.keys(errs).map((name) => ({ name, ...errs[name] }));
  }

  constructor() {
    this.control?.touched;
  }
}
