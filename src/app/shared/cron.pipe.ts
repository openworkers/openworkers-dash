import { Pipe, PipeTransform } from '@angular/core';
import { WasmCron } from '@openworkers/croner-wasm';

function describeCron(pattern: string): string {
  try {
    const croner = new WasmCron(pattern);
    return croner.describe().replace('At every', 'Every').replace('At each', 'Each');
  } catch {
    return pattern;
  }
}

@Pipe({ name: 'cron' })
export class CronPipe implements PipeTransform {
  transform(value: string): string {
    return describeCron(value);
  }
}
