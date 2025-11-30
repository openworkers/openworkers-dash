import { AbstractControl, ValidationErrors } from '@angular/forms';

function createValidator<T extends string>(regexp: RegExp, error: T) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    return regexp.test(control.value) ? null : { [error]: true };
  };
}

export const kebabCaseRegexp = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/u;
export const kebabCaseValidator = createValidator(kebabCaseRegexp, 'kebabCase');

export const visibleRegexp = /^\P{C}+$/u;
export const visibleValidator = createValidator(visibleRegexp, 'visible');

export const visibleBlockRegexp = /^[\P{C}\n]+$/u;
export const visibleBlockValidator = createValidator(visibleBlockRegexp, 'visibleBlock');

export const domainNameRegexp = /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$/;
export const domainNameValidator = createValidator(domainNameRegexp, 'domainName');
