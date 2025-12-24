import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import type { ISelf, IWorker, IEnvironment } from '@openworkers/api-types';
import { AuthService } from './services/auth.service';
import { EnvironmentsService } from './services/environments.service';
import { WorkersService } from './services/workers.service';
import { map } from 'rxjs/operators';
import { RouterDataService } from './services/router-data.service';
import { logger } from '~/logger';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconComponent } from '@ng-icons/core';
import { ThemeSwitchComponent } from './shared/theme-switch/theme-switch.component';

const log = logger.getLogger('AppComponent');

@Component({
  imports: [CommonModule, RouterModule, NgIconComponent, ThemeSwitchComponent],
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {
  public readonly user$: Observable<ISelf | null>;
  public readonly workers$: Observable<IWorker[]>;
  public readonly environments$: Observable<IEnvironment[]>;
  public readonly menuActive$: Observable<string | null>;

  constructor(
    { user$ }: AuthService,
    { data$ }: RouterDataService,
    workers: WorkersService,
    environments: EnvironmentsService
  ) {
    log.debug('Instantiate app component');

    this.menuActive$ = data$.pipe(map((data) => data.menuActive ?? 'default'));

    this.user$ = user$;
    this.workers$ = workers.findAll();
    this.environments$ = environments.findAll();
  }
}
