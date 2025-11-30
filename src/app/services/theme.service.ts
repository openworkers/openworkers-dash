import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { LocalStorage } from './local-storage.service';

export enum Theme {
  Dark = 'dark',
  Light = 'light'
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private theme: Theme;

  private readonly theme$$ = new ReplaySubject<Theme>(1);
  public readonly theme$: Observable<Theme>;

  constructor(private storage: LocalStorage) {
    // Get system theme
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = storage.getItem('theme') ?? systemTheme;
    if (theme !== Theme.Light && theme !== Theme.Dark) {
      this.theme = Theme.Light;
      this.setTheme(Theme.Light);
    } else {
      this.theme = theme;
      this.setTheme(theme);
    }

    this.theme$ = this.theme$$.asObservable();
  }

  setTheme(theme: Theme) {
    const root = document.documentElement;
    this.storage.setItem('theme', theme);
    root.classList.remove(Theme.Dark, Theme.Light);
    root.style.setProperty('color-scheme', theme);
    root.classList.add(theme);
    this.theme$$.next(theme);
    this.theme = theme;
  }

  switchTheme() {
    this.setTheme(this.theme === Theme.Dark ? Theme.Light : Theme.Dark);
  }

  resetTheme() {
    this.storage.removeItem('theme');
  }

  getTheme(): Theme {
    return this.theme;
  }

  isDark() {
    return this.getTheme() === Theme.Dark;
  }

  isLight() {
    return this.getTheme() === Theme.Light;
  }
}
