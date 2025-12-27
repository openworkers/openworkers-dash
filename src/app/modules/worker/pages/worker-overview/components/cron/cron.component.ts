import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { SharedModule } from '~/app/shared/shared.module';
import { WasmCron } from '@openworkers/croner-wasm';
import { debounceTime, filter, firstValueFrom, map, shareReplay, startWith } from 'rxjs';
import { WorkersService } from '~/app/services/workers.service';
import type { ICron, IWorker } from '@openworkers/api-types';
import { AuthService } from '~/app/services/auth.service';

function cronExpressionValidator(control: AbstractControl): ValidationErrors | null {
  console.log('Validating cron expression:', control.value);

  if (!control.value) {
    return null;
  }

  try {
    new WasmCron(control.value.trim());
    return null;
  } catch (error) {
    console.error('Cron expression validation error:', error);
    return { cronExpression: true };
  }
}

function minutePrecisionValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }

  const secondsDisallowedMessage = 'seconds are disallowed';

  try {
    new WasmCron(control.value.trim(), { seconds: 'disallowed' });
    return null;
  } catch (error) {
    console.error('Cron expression validation error:', error);
    if (error instanceof Error && error.message.includes(secondsDisallowedMessage)) {
      return { minutePrecision: true };
    }

    return { cronExpression: true };
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, SharedModule],
  selector: 'app-cron',
  templateUrl: './cron.component.html'
})
export class CronComponent {
  @Input()
  public worker!: IWorker;

  public editMode = false;
  public editId: string | null = null;

  public readonly cron = new FormControl('0/15 * * * *', [cronExpressionValidator, minutePrecisionValidator]);

  private readonly cron$ = this.cron.valueChanges.pipe(
    debounceTime(500),
    startWith(this.cron.value),
    filter(() => this.cron.valid),
    filter((value): value is string => !!value),
    map((value) => value.trim()),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  public readonly schedules$ = this.cron$.pipe(
    map((value) => {
      const croner = new WasmCron(value /* , { timezone: 'UTC' } */);
      return croner.nextRuns(5).map((date) => date.toISOString());
    })
  );

  constructor(
    private workersService: WorkersService,
    { user$ }: AuthService
  ) {
    user$.subscribe((user) => {
      if (!user) {
        throw new Error('Unreachable');
      }

      console.log('Change validators', user.limits);

      if (user.limits.secondPrecision) {
        this.cron.setValidators([cronExpressionValidator]);
      } else {
        this.cron.setValidators([cronExpressionValidator, minutePrecisionValidator]);
      }
    });
  }

  public async addCron() {
    const value = this.cron.value;
    if (!value) {
      return;
    }

    this.cron.disable();

    await firstValueFrom(
      this.editId
        ? this.workersService.updateCron(this.editId, value)
        : this.workersService.createCron(this.worker.id, value)
    );

    this.editId = null;
    this.editMode = false;

    this.cron.reset('0/15 * * * *');
    this.cron.enable();
  }

  public deleteCron(cron: ICron) {
    return firstValueFrom(this.workersService.deleteCron(cron.id));
  }

  public editCron(cron: ICron) {
    this.editId = cron.id;
    this.editMode = true;

    this.cron.setValue(cron.value);
  }

  public cancel() {
    this.editId = null;
    this.editMode = false;
    this.cron.reset('0/15 * * * *');
  }

  private nextEventsCache = new Map<string, string[]>();

  public getNextEvents(crons: readonly ICron[]): string[] {
    const numberOfCrons = 5;
    const cacheKey = crons.map((c) => c.value).join('|');

    if (this.nextEventsCache.has(cacheKey)) {
      return this.nextEventsCache.get(cacheKey)!;
    }

    const result = crons
      .flatMap((cron) => {
        try {
          const croner = new WasmCron(cron.value, { timezone: 'UTC' });
          return croner.nextRuns(5).map((date) => date.toISOString());
        } catch (error) {
          console.error('Error computing next events for cron:', cron.value, error);
          return [];
        }
      })
      .sort()
      .slice(0, numberOfCrons);

    this.nextEventsCache.set(cacheKey, result);
    return result;
  }
}
