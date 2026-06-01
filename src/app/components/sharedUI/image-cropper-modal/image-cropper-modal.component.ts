import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Dimensions, ImageCroppedEvent, ImageTransform, ImageCropperComponent } from "ngx-image-cropper";
import { DomSanitizer } from "@angular/platform-browser";
@Component({
    selector: 'app-image-cropper-modal',
    imports: [ImageCropperComponent],
    templateUrl: './image-cropper-modal.component.html',
    styleUrl: './image-cropper-modal.component.scss'
})
export class ImageCropperModalComponent {
  private sanitizer = inject(DomSanitizer);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor(){

  }
  @Input() loading:boolean = false;
  @Input() imageChangedEvent: any = '';

  @Output() oncroppedImg = new EventEmitter<string>();
  @Output() onImgSelect = new EventEmitter<string>();
  @Output() onsaveImg = new EventEmitter<any>();
  @Output() oncancelCropping = new EventEmitter<any>();
  isImgloaded:boolean=false;
  croppedImage: any = '';
  canvasRotation = 0;
  rotation?: number;
  translateH = 0;
  translateV = 0;
  scale = 1;
  aspectRatio = 6 / 6;
  showCropper = false;
  containWithinAspectRatio = false;
  transform: ImageTransform = {
    translateUnit: 'px'
  };
  imageURL?: string;
  allowMoveImage = true;
  hidden = false;
  fileName:any;

    ngOnInit(): void {
    }

  cropperReady(_sourceImageDimensions: Dimensions) {
    this.loading = false;
  }
  loadImageFailed() {
    console.error('Load image failed');
  }
  resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {
      translateUnit: 'px'
    };
  }

  toggleContainWithinAspectRatio() {
    this.containWithinAspectRatio = !this.containWithinAspectRatio;
  }

  toggleAspectRatio() {
    this.aspectRatio = this.aspectRatio === 4 / 3 ? 16 / 5 : 4 / 3;
  }

  cropImage() {
    this.onsaveImg.emit(true);
    this.isImgloaded = true;
  }
  cancelCropping() {
    this.oncancelCropping.emit(true);
    this.isImgloaded = false;
    this.hidden = true;
    this.croppedImage = '';
  }
  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl || event.base64 || '');
    this.oncroppedImg.emit(this.croppedImage);
  }
  imageLoaded() {
    this.showCropper = true;
  }
}
