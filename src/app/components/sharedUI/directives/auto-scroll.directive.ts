// auto-scroll.directive.ts
import { Directive, HostListener, Input, OnDestroy, inject } from '@angular/core';
import { AutoScrollService } from 'projects/customer-management-ui/shared/auto-scroll/auto-scroll.service';

@Directive({
  selector: '[appAutoScroll]'
})
export class AutoScrollDirective implements OnDestroy {
  // private elementRef = inject(ElementRef);
  private autoScrollService = inject(AutoScrollService);

  @Input() scrollContainer!: HTMLElement;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  @HostListener('dragstart', ['$event'])
  onDragStart(_event: DragEvent) {
    this.setupGlobalDragOver();
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (this.scrollContainer) {
      this.autoScrollService.checkAndScroll(event, this.scrollContainer);
    }
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(_event: DragEvent) {
    // Don't stop scrolling
  }

  @HostListener('drop', ['$event'])
  onDrop(_event: DragEvent) {
    this.autoScrollService.stopScroll();
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(_event: DragEvent) {
    this.autoScrollService.stopScroll();
  }

  private setupGlobalDragOver() {
    const globalDragOver = (event: DragEvent) => {
      if (this.scrollContainer) {
        this.autoScrollService.checkAndScroll(event, this.scrollContainer);
      }
    };

    document.addEventListener('dragover', globalDragOver);

    // Clean up on drag end
    const cleanup = () => {
      document.removeEventListener('dragover', globalDragOver);
      this.autoScrollService.stopScroll();
      document.removeEventListener('dragend', cleanup);
    };

    document.addEventListener('dragend', cleanup);
  }

  ngOnDestroy() {
    this.autoScrollService.stopScroll();
  }
}