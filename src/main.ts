import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { BootService } from '~/services/boot.service';
import { environment } from '~/environment';
import { logger } from '~/logger';

const log = logger.getLogger('Document');

if (environment.production) {
  enableProdMode();
}

BootService.setBootControl(() =>
  bootstrapApplication(AppComponent, appConfig)
    .then(() => log.debug('Application bootstrapped'))
    .catch((error) => log.error('Failed to bootstrap application', error))
);

document.addEventListener('DOMContentLoaded', () => {
  log.debug('DOM loaded');
  BootService.start();
});
