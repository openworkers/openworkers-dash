import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ThemeService } from '~/app/services/theme.service';

@Component({
  imports: [CommonModule],
  selector: 'app-theme-switch',
  templateUrl: './theme-switch.component.html'
})
export class ThemeSwitchComponent {
  public readonly theme$: Observable<'dark' | 'light'>;
  constructor(private themeService: ThemeService) {
    this.theme$ = themeService.theme$;
  }

  switchTheme() {
    this.themeService.switchTheme();
  }
}
