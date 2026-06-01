// auto-scroll.service.ts
import { Injectable, NgZone, inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AutoScrollService {
  private ngZone = inject(NgZone);

  private scrollInterval: any;
  private scrollSpeed = 10;
  private scrollEdgeThreshold = 50;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]); // pixels from edge to trigger scroll

  constructor() {}

  startHorizontalScroll(container: HTMLElement, direction: 'left' | 'right') {
    this.stopScroll();
    
    this.ngZone.runOutsideAngular(() => {
      this.scrollInterval = setInterval(() => {
        if (direction === 'left') {
          container.scrollLeft -= this.scrollSpeed;
        } else {
          container.scrollLeft += this.scrollSpeed;
        }
      }, 16); // ~60fps
    });
  }

  startVerticalScroll(container: HTMLElement, direction: 'up' | 'down') {
    this.stopScroll();
    
    this.ngZone.runOutsideAngular(() => {
      this.scrollInterval = setInterval(() => {
        if (direction === 'up') {
          container.scrollTop -= this.scrollSpeed;
        } else {
          container.scrollTop += this.scrollSpeed;
        }
      }, 16);
    });
  }

  stopScroll() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }

  checkAndScroll(event: DragEvent, container: HTMLElement): boolean {
    if (!container) return false;

    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    let scrolled = false;

    // Horizontal auto-scroll
    if (mouseX < rect.left + this.scrollEdgeThreshold) {
      this.startHorizontalScroll(container, 'left');
      scrolled = true;
    } else if (mouseX > rect.right - this.scrollEdgeThreshold) {
      this.startHorizontalScroll(container, 'right');
      scrolled = true;
    }
    // Vertical auto-scroll
    else if (mouseY < rect.top + this.scrollEdgeThreshold) {
      this.startVerticalScroll(container, 'up');
      scrolled = true;
    } else if (mouseY > rect.bottom - this.scrollEdgeThreshold) {
      this.startVerticalScroll(container, 'down');
      scrolled = true;
    } else {
      this.stopScroll();
    }

    return scrolled;
  }
}