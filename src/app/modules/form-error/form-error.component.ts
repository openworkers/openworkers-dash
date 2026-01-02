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
  templateUrl: './form-error.component.html'
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
