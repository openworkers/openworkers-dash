import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';
import { TypedSimpleChanges } from '~/app/interfaces/typed-changes';

@Component({
  imports: [CommonModule, ReactiveFormsModule, NgIconComponent],
  selector: 'app-editable',
  templateUrl: './editable.component.html',
  styles: [':host:not(:hover) { span.clickable { opacity: 0.5; } }'],
  standalone: true
}) // https://github.com/microsoft/TypeScript/issues/31325#issuecomment-490923127
export class EditableComponent<T extends { [P in K]?: string | null }, K extends keyof T> implements OnChanges {
  @Input()
  target!: T;

  @Input()
  key!: K; // Key to watch

  @Input()
  class?: string;

  @Input()
  placeholder = '';

  // https://stackoverflow.com/a/41095677/4111143
  @ViewChild('input', { static: false })
  set input(el: ElementRef<HTMLInputElement> | undefined) {
    if (el) {
      el.nativeElement.focus();
    }
  }

  @Output()
  public readonly update: EventEmitter<Pick<T, K>> = new EventEmitter();

  public editing = false;

  public control: FormControl<T[K] | null> = new FormControl<T[K] | null>(null);

  ngOnChanges(changes: TypedSimpleChanges<{ target: T; watch: K }>) {
    if (changes.target || changes.watch) {
      this.control.setValue(this.target[this.key]);
    }
  }

  submit() {
    const k = this.key;
    const v = this.control.value;
    this.update.emit({ [k]: v || null } as Pick<T, K>);
    this.editing = false;
  }
}
