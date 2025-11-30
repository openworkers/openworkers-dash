
import { Component, Input } from '@angular/core';
import { environment } from '~/environment';

@Component({
  imports: [],
  selector: 'app-debug',
  templateUrl: 'debug.component.html',
  styles: ['pre { white-space: pre-wrap; overflow-x: hidden }']
})
export class DebugComponent {
  public readonly display = environment.debug;

  @Input()
  public expand = false;
}
