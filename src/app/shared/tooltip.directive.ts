import { Directive, ElementRef, HostListener, Input, OnInit, Renderer2 as Renderer } from '@angular/core';

@Directive({
  selector: '[tooltip]'
})
export class TooltipDirective implements OnInit {
  private tooltip!: HTMLElement;

  @Input('tooltip')
  content!: string;

  @Input()
  placement?: string;

  @HostListener('mouseenter')
  onMouseEnter() {
    this.tooltip.classList.remove('hidden');
    this.setPosition();
    this.tooltip.classList.add('display');
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.tooltip.classList.remove('display');
    setTimeout(() => this.tooltip.classList.add('hidden'), 200);
  }

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer) {}

  ngOnInit() {
    const tooltip = this.renderer.createElement('span');
    tooltip.innerText = this.content;

    this.renderer.addClass(tooltip, 'hidden');
    this.renderer.addClass(tooltip, 'ng-tooltip');
    this.renderer.addClass(tooltip, this.placement ?? 'left');
    this.tooltip = this.el.nativeElement.appendChild(tooltip);
  }

  private setPosition() {
    const hostPos = this.el.nativeElement.getBoundingClientRect();
    const tooltipPos = this.tooltip.getBoundingClientRect();
    const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    let top = 0;
    let left = 0;
    let offset = 10;

    switch (this.placement) {
      case 'top':
        top = hostPos.top - tooltipPos.height - offset;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'bottom':
        top = hostPos.bottom + offset;
        left = hostPos.left + (hostPos.width - tooltipPos.width) / 2;
        break;
      case 'left':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.left - tooltipPos.width - offset;
        break;
      case 'right':
        top = hostPos.top + (hostPos.height - tooltipPos.height) / 2;
        left = hostPos.right + offset;
        break;
    }

    this.renderer.setStyle(this.tooltip, 'top', `${top + scrollPos}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }
}
