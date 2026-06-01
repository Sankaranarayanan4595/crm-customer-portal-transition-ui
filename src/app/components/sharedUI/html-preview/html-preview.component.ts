import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { SharepointService } from "projects/customer-management-ui/shared/sharepoint/sharepoint.service";
import { DomSanitizer } from "@angular/platform-browser";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-view-modal",
  imports: [],
  templateUrl: "./html-preview.component.html",
  styleUrl: "./html-preview.component.scss"
})
export class HtmlPreviewComponent {
  // private element = inject(ElementRef);
  // private renderer = inject(Renderer2);
  private sharePoint = inject(SharepointService);
  private sanitizer = inject(DomSanitizer);

  templateName: any;
  @Input() PreviewDocument: any;
  docubeeList: any;
  fileUrl: any;
  fileName: any;
  @Output() closeTempDocument = new EventEmitter<boolean>();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }
  ngOnInit(): void {
    this.pageLoad();
  }

  closeViewModal() {
    this.closeTempDocument.emit(false);
  }
  printViewDocument() {
    this.convertToPDF();
    const iframe: any = document.querySelector(".iframeClass");
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }
  downloadFile() {
    this.sharePoint.downloadFile(this.PreviewDocument?.fileBlob, this.fileName);
  }
  pageLoad() {
    this.templateName = this.PreviewDocument?.templateName;
    this.fileName = this.PreviewDocument?.fileName;
    const mimeType = this.sharePoint.getMimeType(this.fileName);
    const doctype = ["doc", "docx"];
    const extension = this.fileName.split(".").pop()?.toLowerCase();
    const blob = new Blob([this.PreviewDocument?.fileBlob], { type: mimeType });
    if (doctype.includes(extension)) {
      const fileUrl = `https://docs.google.com/gview?url=${URL.createObjectURL(blob)}&embedded=true`;
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    } else {
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
    }
  }
  convertToPDF() {
    const data: any = document.getElementById("contentToConvert");
    html2canvas(data).then((canvas) => {
      const imgWidth = 208;
      // const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      // const heightLeft = imgHeight;

      const contentDataURL = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4"); // A4 size page of PDF

      let position = 0;
      pdf.addImage(contentDataURL, "PNG", 0, position, imgWidth, imgHeight);
      pdf.save("GeneratedPDF.pdf"); // Generated PDF
    });
  }
}
