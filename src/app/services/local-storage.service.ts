import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorage {
  public get length() {
    return localStorage.length;
  }

  public clear(): void {
    localStorage.clear();
  }

  public getItem<T = string>(key: string): T | null {
    const item = localStorage.getItem(key);
    return item && JSON.parse(item);
  }

  public key(index: number): string | null {
    return localStorage.key(index);
  }

  public removeItem(key: string): void {
    return localStorage.removeItem(key);
  }

  public setItem(key: string, value: string | null): void {
    if (value === null) {
      return localStorage.removeItem(key);
    }

    return localStorage.setItem(key, JSON.stringify(value));
  }
}
