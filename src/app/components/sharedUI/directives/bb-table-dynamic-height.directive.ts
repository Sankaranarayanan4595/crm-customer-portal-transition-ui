// import {
//   Directive,
//   ElementRef,
//   Input,
//   Output,
//   EventEmitter,
//   AfterViewInit,
//   OnDestroy,
//   HostListener,
//   ChangeDetectorRef,
// } from "@angular/core";
// import { debug } from "console";

// @Directive({
//   selector: "[bbTableDynamicHeight]",
//   standalone: true,
// })
// export class BbTableDynamicHeightDirective implements AfterViewInit, OnDestroy {
//   @Input() heightOffset: number = 0;
//   @Output() heightChange = new EventEmitter<string>();

//   private resizeObserver!: ResizeObserver;

//   constructor(
//     private el: ElementRef,
//     private cdRef: ChangeDetectorRef
//   ) {}

//   ngAfterViewInit() {
//     this.initObserver();
//     setTimeout(() => this.calculateHeight(), 10);
//   }

//   @HostListener('window:resize')
//   onResize() {
//     this.calculateHeight();
//   }

//   private initObserver() {
//     if (this.resizeObserver) return;
//     this.resizeObserver = new ResizeObserver(() => this.calculateHeight());
//     this.resizeObserver.observe(document.body);
//   }

//   // calculateHeight() {
//   //   if (!this.el?.nativeElement) return;

//   //   const vh = window.innerHeight;
//   //   const rect = this.el.nativeElement.getBoundingClientRect();

//   //   // Get paginator height if present (PrimeNG paginator is outside scroll area)
//   //   const paginator = this.el.nativeElement.querySelector('.p-paginator');
//   //   const paginatorHeight = paginator ? paginator.getBoundingClientRect().height : 50;

//   //   // Get header height
//   //   const thead = this.el.nativeElement.querySelector('.p-datatable-thead');
//   //   const theadHeight = thead ? thead.getBoundingClientRect().height : 45;

//   //   const top = rect.top > 0 ? rect.top : 0;

//   //   // Available height = viewport - table top position - paginator - small buffer
//   //   const calculatedHeight = Math.max(
//   //     vh - top - paginatorHeight - theadHeight - this.heightOffset - 16,
//   //     300
//   //   );

//   //   this.heightChange.emit(`${calculatedHeight}px`);
//   //   this.cdRef.detectChanges();
//   // }

//   calculateHeight() {
//     debugger;
//   if (!this.el?.nativeElement) return;

//   const vh = window.innerHeight;
//   const rect = this.el.nativeElement.getBoundingClientRect();

//   // 1. Get the vertical position of the table on the screen
//   const topOffset = rect.top;

//   // 2. Identify external elements that take up space inside the table component
//   // PrimeNG paginators are usually at the bottom
//   const paginator = this.el.nativeElement.querySelector('.p-paginator');
//   const paginatorHeight = paginator ? paginator.offsetHeight : 0;

//   // 3. Identify the header height
//   // Note: Since you are setting [scrollHeight], PrimeNG applies this to the .p-datatable-wrapper.
//   // The header sits above this. If your directive is on the p-table, rect.top already 
//   // accounts for where the table starts.
//   const thead = this.el.nativeElement.querySelector('.p-datatable-thead');
//   const theadHeight = thead ? thead.offsetHeight : 0;

//   // CALCULATION:
//   // Total Viewport - Distance from top - Paginator - Header - Buffer
//   // We subtract theadHeight because scrollHeight only defines the tbody area.
//   const buffer = 0; // Adjust this for your footer/margin needs
//   const calculatedHeight = vh - topOffset - theadHeight - paginatorHeight - this.heightOffset - buffer;

//   // Ensure a minimum height so it doesn't disappear on small screens
//   const finalHeight = Math.max(calculatedHeight, 300);

//   this.heightChange.emit(`${finalHeight}px`);
//   this.cdRef.detectChanges();
// }
//   ngOnDestroy() {
//     if (this.resizeObserver) {
//       this.resizeObserver.disconnect();
//     }
//   }
// }

import { Directive, ElementRef, ChangeDetectorRef, HostListener, Input, Output, EventEmitter, AfterViewInit, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[bbTableDynamicHeight]',
  standalone: true // Remove if you are using ngModules
})
export class BbTableDynamicHeightDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private cdRef = inject(ChangeDetectorRef);

  @Input() heightOffset: number = 0;
  @Output() heightChange = new EventEmitter<string>();

  private resizeObserver!: ResizeObserver;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  ngAfterViewInit() {
    this.initObserver();
    // Wait for the browser to finish rendering the layout before calculating
    setTimeout(() => this.calculateHeight(), 300);
  }

  @HostListener('window:resize')
  onResize() {
    this.calculateHeight();
  }

  private initObserver() {
    if (this.resizeObserver) return;
    this.resizeObserver = new ResizeObserver(() => this.calculateHeight());
    // Observing the table element instead of document.body is much more accurate
    this.resizeObserver.observe(this.el.nativeElement); 
  }

  calculateHeight() {
    if (!this.el?.nativeElement) return;

    // Use requestAnimationFrame to ensure all pending UI updates are painted
    requestAnimationFrame(() => {
      const tableElement = this.el.nativeElement;
      const vh = window.innerHeight;
      
      // Get exact position of the table from the top of the viewport
      const rect = tableElement.getBoundingClientRect();
      const top = rect.top > 0 ? rect.top : 0;

      // Find the paginator dynamically
      const paginator = tableElement.querySelector('.p-paginator');
      const paginatorHeight = paginator ? paginator.offsetHeight : 55; // Safe fallback

      // In PrimeNG, scrollHeight applies to the wrapper (which INCLUDES the header). 
      // We do NOT subtract the header height here, otherwise the table body gets too squished.
      
      // We add a strict safe buffer to prevent the 1-2px overflow that triggers window scrolling
      const safeBuffer = 25; 

      // Available space = Viewport - Table Top Position - Paginator - Offset - Buffer
      const calculatedHeight = Math.floor(vh - top - paginatorHeight - this.heightOffset - safeBuffer);

      // Ensure it never shrinks beyond a usable size
      const finalHeight = Math.max(calculatedHeight, 300);

      this.heightChange.emit(`${finalHeight}px`);
      this.cdRef.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}