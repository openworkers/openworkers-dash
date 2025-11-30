import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'plural' })
export class PluralPipe implements PipeTransform {
  transform(n: number, str: string): string {
    return `${n} ${str}${n > 1 ? 's' : ''}`;
  }
}
