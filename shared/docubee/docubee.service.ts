import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { lastValueFrom, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class DocubeeService {
  private http = inject(HttpClient);

  apiUrl = environment.CRM_ApiUrl;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  uploadDocubeeDocument(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/fileTransaction/DocubeeUpload`, data));
  }
  GetDocubeeFileDetails(id: string): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/fileTransaction/GetDocubeeFileDetails/${id}`));
  }
  updateFieldsDetails(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/fileTransaction/DocubeeFields`, data));
  }

  docubeePlaceUpdateFieldsOnDocument(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/fileTransaction/docubeePlaceUpdateFieldsOnDocument`, data));
  }
  getDoubeeProcessStatus(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/fileTransaction/getDocumentStatus`, data));
  }

  getDocubeeList(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/master/getDocubeeList`));
  }
  beActiveAnchorStringList(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/master/beActiveAnchorStringList`));
  }

  getDocubeeTempList(ids: any[], companyId: string): Promise<any> {
    const idsString = Array.isArray(ids)
      ? ids.map(id => typeof id === 'string' ? id : id?._id).filter(Boolean).join(",")
      : '';

    // Always call the endpoint, even if idsString is empty
    return lastValueFrom(
      this.http.get<any>(`${this.apiUrl}/master/getDocubeeTempList/${companyId}/${idsString}`)
    );
  }
  getTemplateDetails(data: string) {
    return this.http.get<any>(`${this.apiUrl}/master/getTemplateDetails/${data}`);
  }


  // Your Angular service method to request the file
  getFileFromDocubee(data: any) {
    // Note: responseType: 'blob' returns Blob directly
    return this.http.post(`${this.apiUrl}/fileTransaction/docubeeDownload`, data, { responseType: 'blob' });
  }


  downloadFile(uploadId: string, filePath: string): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: "YOUR_API_KEY", // Replace with your API key
    });

    return this.http.get(`${this.apiUrl}/${uploadId}`, { headers, responseType: "blob" }).pipe(
      tap((response: Blob) => {
        const a = document.createElement("a");
        const objectUrl = URL.createObjectURL(response);
        a.href = objectUrl;
        a.download = filePath;
        a.click();
        URL.revokeObjectURL(objectUrl);
      })
    );
  }
}
