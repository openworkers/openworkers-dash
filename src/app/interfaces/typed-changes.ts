import { SimpleChange } from '@angular/core';

// https://stackoverflow.com/a/48244432/4111143
type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U];

export declare class TypedSimpleChange<T> extends SimpleChange {
  previousValue: T;
  currentValue: T;
  constructor(previousValue: T, currentValue: T, firstChange: boolean);
}

export type TypedSimpleChanges<T> = AtLeastOne<{ [K in keyof T]: TypedSimpleChange<T[K]> }>;
