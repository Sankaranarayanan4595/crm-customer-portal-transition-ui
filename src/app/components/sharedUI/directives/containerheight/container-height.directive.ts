import { Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({
  selector: '[containerHeight]'
})
export class ContainerHeightDirective {
private el = inject(ElementRef);

/** Inserted by Angular inject() migration for backwards compatibility */
constructor(...args: unknown[]);


constructor() {}
@Input() offset = 14;// its header height
  private resizeObserver!: ResizeObserver;
  ngAfterViewInit() {
    this.adjustHeight();
 
    // Observe size/content changes
    this.resizeObserver = new ResizeObserver(() => {
      this.adjustHeight();
    });
    this.resizeObserver.observe(this.el.nativeElement);
  }
 
  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
 
private adjustHeight() {
  const element = this.el.nativeElement as HTMLElement;

  const rect = element.getBoundingClientRect();
  const viewportAvailable = Math.max(window.innerHeight - rect.top - this.offset, 0);

  // Reset first to measure natural content height
  element.style.height = 'auto';

  const contentHeight = element.scrollHeight;

  // Apply max constraint only if content exceeds viewport space
  if (contentHeight > viewportAvailable) {
    element.style.maxHeight = `${viewportAvailable}px`;
    element.style.overflowY = 'auto';
  } else {
    element.style.maxHeight = 'none';
    element.style.overflowY = 'visible';
  }
}


}



