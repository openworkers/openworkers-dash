import { Injectable, NgZone } from '@angular/core';

type BootCtrlFn = () => Promise<void>;

let reboot: BootCtrlFn;

@Injectable({ providedIn: 'root' })
export class BootService {
  constructor(private ngZone: NgZone) {
    console.log('Instantiating BootService');
  }

  public static setBootControl(fn: BootCtrlFn) {
    reboot = fn;
  }

  public static start() {
    reboot();
  }

  public restart() {
    this.ngZone.runOutsideAngular(() => reboot());
  }
}
