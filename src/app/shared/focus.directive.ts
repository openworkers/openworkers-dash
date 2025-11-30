import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: 'input[focus]'
})
export class FocusDirective implements OnInit {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnInit() {
    this.el.nativeElement.focus();
  }
}
