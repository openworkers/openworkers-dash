import { Directive, ElementRef, Input, NgModule, OnInit, Renderer2 } from '@angular/core';
import { TypedSimpleChanges } from '../interfaces/typed-changes';

enum Icons {
  'clock' = 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  'new-tab' = 'M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25',
  'arrow-back' = 'M11.25 9l-3 3m0 0l3 3m-3-3h7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'check-circle' = 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'x-circle' = 'M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'pencil-square' = 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10',
  'lock-open' = 'M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
  'lock-close' = 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
  'trash' = 'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0',
  'revert' = 'M15 7v-4.992m 0 0h4.992M5.636 5.636a9 9 0 1012.728 0',
  'ellipsis-vertical' = 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'power' = 'M5.636 5.636a9 9 0 1012.728 0'
}

@Directive({ selector: 'i[icon]' })
export class IconDirective implements OnInit {
  @Input()
  public icon!: keyof typeof Icons;

  @Input()
  public color = '#6b7280';

  safeBackgroundImage: any;

  private path?: SVGPathElement;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    const svg = this.renderer.createElement('svg', 'svg');
    this.renderer.setAttribute(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    this.renderer.setAttribute(svg, 'fill', 'none');
    this.renderer.setAttribute(svg, 'viewBox', '0 0 24 24');
    this.renderer.setAttribute(svg, 'stroke-width', '1.5');
    this.renderer.setAttribute(svg, 'stroke', this.color);
    this.renderer.setAttribute(svg, 'height', '1rem');
    this.renderer.setAttribute(svg, 'width', '1rem');

    const path = this.renderer.createElement('path', 'svg');
    this.renderer.setAttribute(path, 'stroke-linecap', 'round');
    this.renderer.setAttribute(path, 'stroke-linejoin', 'round');
    this.renderer.setAttribute(path, 'd', Icons[this.icon]);

    this.renderer.appendChild(svg, path);
    this.path = path;

    this.renderer.appendChild(this.el.nativeElement, svg);
    this.renderer.setStyle(this.el.nativeElement, 'display', 'inline-block');
  }

  ngOnChanges(changes: TypedSimpleChanges<{ icon: keyof typeof Icons }>): void {
    if (changes['icon']) {
      this.path?.setAttribute('d', Icons[changes['icon'].currentValue]);
    }
  }
}
