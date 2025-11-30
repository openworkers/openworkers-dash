import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map, Observable, tap } from 'rxjs';
import { logger } from '~/logger';

const log = logger.getLogger('IframeComponent');

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-iframe',
  template: '@if (safeUrl$ | async; as url) {<iframe class="w-full h-full" [src]="url"></iframe>}'
})
export class IframeComponent implements OnInit {
  public safeUrl$?: Observable<SafeResourceUrl>;

  @Input('reload')
  reload$?: Observable<string>;

  constructor(private domSanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.reload$) {
      this.safeUrl$ = this.reload$.pipe(
        tap((url) => log.debug('Reload iframe', url)),
        map((url) => this.domSanitizer.bypassSecurityTrustResourceUrl(url))
      );
    }
  }
}
