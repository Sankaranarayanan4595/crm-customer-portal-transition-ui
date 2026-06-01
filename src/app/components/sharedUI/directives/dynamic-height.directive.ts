import { Directive, ElementRef, Input, OnChanges, OnDestroy, AfterViewInit, SimpleChanges, inject } from '@angular/core';

@Directive({
  selector: '[dynamicHeight]'
})
export class DynamicHeightDirective
  implements AfterViewInit, OnChanges, OnDestroy {
  private el = inject(ElementRef);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);


  constructor() {}

  @Input() offset = 14;
  @Input() isHeight: boolean = false;

  private resizeObserver!: ResizeObserver;

  ngAfterViewInit() {
    if (this.isHeight) {
      this.initObserver();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isHeight']) {
      if (this.isHeight) {
        this.initObserver();
      } else {
        this.cleanup();
      }
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private initObserver() {
    if (this.resizeObserver) return;

    this.adjustHeight();

    this.resizeObserver = new ResizeObserver(() => {
      this.adjustHeight();
    });

    this.resizeObserver.observe(this.el.nativeElement);
  }

  private cleanup() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = undefined as any;
    }

    this.el.nativeElement.style.removeProperty('height');
    this.el.nativeElement.style.removeProperty('overflow-y');
  }

  private adjustHeight() {
    if (!this.isHeight) return;

    const rect = this.el.nativeElement.getBoundingClientRect();
    const availableHeight = Math.max(
      window.innerHeight - rect.top - this.offset,
      0
    );

    this.el.nativeElement.style.height = `${availableHeight}px`;
    this.el.nativeElement.style.overflowY = 'auto';
  }
}
