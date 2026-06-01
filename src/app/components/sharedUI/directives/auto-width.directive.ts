import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
  selector: 'input[autoWidth]'
})
export class AutoWidthDirective {
  private el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  private mirror: HTMLSpanElement;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    // Create hidden span to measure text width
    this.mirror = document.createElement('span');
    this.mirror.style.visibility = 'hidden';
    this.mirror.style.position = 'fixed';
    this.mirror.style.whiteSpace = 'pre';
    this.mirror.style.left = '-9999px';

    // Copy font styles from input
    const inputStyles = window.getComputedStyle(this.el.nativeElement);
    this.mirror.style.font = inputStyles.font;
    this.mirror.style.letterSpacing = inputStyles.letterSpacing;
    this.mirror.style.padding = inputStyles.padding;

    document.body.appendChild(this.mirror);
  }

  ngOnInit() {
    this.resize();
  }

  @HostListener('input')
  onInput() {
    this.resize();
  }

  private resize() {
    const input = this.el.nativeElement;
    this.mirror.textContent = input.value || ' ';
    const newWidth = this.mirror.offsetWidth + 12;
    input.style.width = newWidth + 'px';
  }
}
