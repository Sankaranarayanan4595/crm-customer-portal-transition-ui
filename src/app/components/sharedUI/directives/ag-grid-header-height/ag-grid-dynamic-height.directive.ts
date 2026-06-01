// caching
import { Directive, ElementRef, Input, AfterViewInit, AfterViewChecked, OnDestroy, Renderer2, inject } from '@angular/core';

@Directive({
  selector: '[agGridDynamicHeight]'
})
export class AgGridDynamicHeightDirective implements AfterViewInit, AfterViewChecked, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() heightOffset?: number;
  @Input() additionalOffset: number = 20;
  @Input() autoCalculateOffset: boolean = true;
  @Input() minRowsForFixedHeight: number = 11;

  private resizeListener = () => this.recalculateOffset();
  private static stylesInjected = false;
  private lastRowCount: number = 0;
  private lastCalculatedHeight: number = 0;
  private cachedOffset: number | undefined;
  private lastSiblingCount: number = 0;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]); // Track sibling changes

  constructor() {
    this.injectStyles();
  }

  ngAfterViewInit() {
    setTimeout(() => this.calculateGridHeight(), 200);
    window.addEventListener('resize', this.resizeListener);
  }

  ngAfterViewChecked() {
    if (!this.el.nativeElement) return;

    const gridElement = this.el.nativeElement;
    const parent = gridElement.parentElement;

    // Check if siblings changed (new elements added/removed)
    if (parent) {
      const currentSiblingCount = parent.children.length;
      if (currentSiblingCount !== this.lastSiblingCount) {
        // console.log('🔄 Siblings changed:', this.lastSiblingCount, '->', currentSiblingCount);
        this.lastSiblingCount = currentSiblingCount;
        this.cachedOffset = undefined; // Clear cache to recalculate
        setTimeout(() => this.calculateGridHeight(), 0);
        return;
      }
    }

    // Check if row count changed
    const bodyViewport = gridElement.querySelector('.ag-body-viewport');
    if (bodyViewport) {
      const rows = bodyViewport.querySelectorAll('.ag-row');
      const currentRowCount = rows.length;

      if (currentRowCount !== this.lastRowCount) {
        // console.log('📊 Row count changed:', this.lastRowCount, '->', currentRowCount);
        this.lastRowCount = currentRowCount;
        setTimeout(() => this.calculateGridHeight(), 0);
      }
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeListener);
    this.cachedOffset = undefined;
  }

  private injectStyles() {
    if (AgGridDynamicHeightDirective.stylesInjected) return;

    const style = this.renderer.createElement('style');
    style.textContent = `
      .aggrid_customHeight .ag-body-viewport {
        height: var(--ag-body-height, 60vh) !important;
        overflow-y: scroll !important;
        overflow-x: auto !important;
        scrollbar-width: thin !important;
        scroll-behavior: smooth;
      }
      
      .aggrid_customHeight .ag-body-viewport.auto-height {
        height: auto !important;
        overflow: visible !important;
      }
    `;
    this.renderer.appendChild(document.head, style);
    AgGridDynamicHeightDirective.stylesInjected = true;
  }

  private recalculateOffset() {
    // Clear cache on window resize
    this.cachedOffset = undefined;
    this.calculateGridHeight();
  }

  private calculateGridHeight() {
    if (!this.el?.nativeElement) return;

    const gridElement = this.el.nativeElement;
    const bodyViewport = gridElement.querySelector('.ag-body-viewport');

    if (!bodyViewport) {
      setTimeout(() => this.calculateGridHeight(), 100);
      return;
    }

    const viewport = bodyViewport as HTMLElement;
    const rows = bodyViewport.querySelectorAll('.ag-row');

    // Get offset - recalculates if cache cleared
    let offset = this.getOffset(gridElement);

    // Calculate available height
    const rect = gridElement.getBoundingClientRect();
    const availableHeight = window.innerHeight - rect.top - offset;

    // Only log if height changed significantly
    if (Math.abs(availableHeight - this.lastCalculatedHeight) > 5) {
      // console.log('Total height:', window.innerHeight, '| Rows:', rows.length, '| Rect.top:', rect.top, '| Available height:', availableHeight, '| Offset:', offset);
      this.lastCalculatedHeight = availableHeight;
    }

    // Auto-height for few rows
    if (rows.length < this.minRowsForFixedHeight) {
      viewport.classList.add('auto-height');
      viewport.style.removeProperty('height');
      this.el.nativeElement.style.removeProperty('--ag-body-height');
    } else {
      // Fixed height with scroll
      viewport.classList.remove('auto-height');
      const bodyHeight = Math.max(availableHeight, 200);
      gridElement.style.setProperty('--ag-body-height', `${bodyHeight}px`);
    }
  }

  private getOffset(gridElement: HTMLElement): number {
    // Return cached offset if available
    if (this.cachedOffset !== undefined) {
      // console.log('✓ Using cached offset:', this.cachedOffset);
      return this.cachedOffset;
    }

    let calculatedOffset: number;

    // Manual offset takes priority
    if (this.heightOffset !== undefined) {
      calculatedOffset = this.heightOffset;
    }
    // Auto-calculate from parent's children
    else if (this.autoCalculateOffset) {
      calculatedOffset = this.calculateOffsetFromParent(gridElement);
    }
    // Default
    else {
      calculatedOffset = this.additionalOffset;
    }

    // Cache the offset
    this.cachedOffset = calculatedOffset;
    // console.log('💾 Cached new offset:', calculatedOffset);
    return calculatedOffset;
  }

  private calculateOffsetFromParent(gridElement: HTMLElement): number {
    const parent = gridElement.parentElement;
    if (!parent) return this.additionalOffset;

    let totalOffset = 0;
    const children = Array.from(parent.children);

    // console.log('=== Calculating Offset ===');

    // Sum heights of children BEFORE grid element
    for (const child of children) {
      if (child === gridElement) break;

      const height = (child as HTMLElement).getBoundingClientRect().height;
      if (height > 0) {
        totalOffset += height;
        // const tag = child.tagName;
        // const className = (child as HTMLElement).className || 'no-class';
        // console.log(`  ${tag}.${className}: ${height}px`);
      }
    }

    // Add parent padding
    const parentStyle = window.getComputedStyle(parent);
    const paddingTop = parseFloat(parentStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(parentStyle.paddingBottom) || 0;
    totalOffset += paddingTop + paddingBottom;

    // console.log('  Parent padding:', paddingTop + paddingBottom);

    // Add buffer
    totalOffset += this.additionalOffset;

    // console.log('  Final offset:', totalOffset);
    return totalOffset;
  }
}