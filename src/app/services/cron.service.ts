import { Injectable } from '@angular/core';
import init from '@openworkers/croner-wasm';

@Injectable({ providedIn: 'root' })
export class CronService {
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await init('/assets/wasm/croner_wasm_bg.wasm');

    this.initialized = true;
  }
}
