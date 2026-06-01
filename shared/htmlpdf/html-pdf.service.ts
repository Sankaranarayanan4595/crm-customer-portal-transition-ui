import { Injectable, inject } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
@Injectable({
  providedIn: "root",
})
export class HtmlPdfService {
  private http = inject(HttpClient);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  private apiUrl = environment.htmlPdf;

  convertHtmlFileToPdf(file: File) {
    const url = `${this.apiUrl}?timestamp=${Date.now()}`;
    const headers = new HttpHeaders({
    'shared-link': 'true' // avoid token and unauthorized
  });
 

    const formData = new FormData();
    formData.append("pdfFileInput", file);

  return this.http.post(url, formData, {
    headers,
    responseType: "json"   // ✅ MUST include this
  });
  }
}
