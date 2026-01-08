import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {
    // Configure marked for inline rendering (no <p> wrapper for single lines)
    marked.setOptions({
      breaks: true,
      gfm: true
    });
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    const html = marked.parse(value, { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
