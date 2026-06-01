import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateHtml',
  standalone: true
})
export class TruncateHtmlPipe implements PipeTransform {
 transform(value: string): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ''); // ← only strips HTML tags, no limit
}
}