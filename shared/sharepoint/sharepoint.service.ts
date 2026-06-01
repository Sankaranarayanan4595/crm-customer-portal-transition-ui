import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
import axios from "axios";

@Injectable({
  providedIn: "root",
})
export class SharepointService {
  private http = inject(HttpClient);

  private apiUrl = environment.CRM_ApiUrl;
  fileStorageServiceUrl!: string;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  // private getHeaders(token: any): HttpHeaders {
  //   return new HttpHeaders({
  //     Authorization: `Bearer ${token}`,
  //     Accept: "application/json;odata=verbose",
  //     "Content-Type": "application/json;odata=verbose",
  //   });
  // }
  async checkFolderExists(serverRelativeUrl: string, token: any) {
    try {
      const url = `${environment.SharedFilePath}/sites/${environment.SharePointAppName}/_api/web/GetFolderByServerRelativeUrl('/sites/${environment.SharePointAppName}/Shared Documents/${serverRelativeUrl}')`;

      await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  }
  async createFolder(serverRelativeUrl: string, token: string): Promise<boolean> {
    try {
      const url = `${environment.SharedFilePath}/sites/${environment.SharePointAppName}/_api/web/folders`;
      const body = JSON.stringify({
        __metadata: { type: 'SP.Folder' },
        ServerRelativeUrl: `Shared Documents/${serverRelativeUrl}`
      });
      await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose'
        }
      });
      return true;
    } catch (err) {
      console.error('Error creating folder:', err);
      return false;
    }
  }


  async ensureFolderExists(serverRelativeUrl: string, token: string): Promise<boolean> {
    const pathParts = serverRelativeUrl.split('/').filter(part => part.length > 0); // Split and filter out empty parts
    let currentPath = '';

    for (const part of pathParts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const folderExists = await this.checkFolderExists(currentPath, token);
      if (!folderExists) {
        const created = await this.createFolder(currentPath, token);
        if (!created) {
          return false;
        }
      }
    }
    return true;
  }

  // async checkFolderExists(serverRelativeUrl: string, token: any) {
  //   try {
  //     const url = `${environment.SharedFilePath}/sites/${environment.SharePointAppName}/_api/web/GetFolderByServerRelativeUrl('/sites/${environment.SharePointAppName}/Shared Documents/${serverRelativeUrl}')`;

  //     const res = await axios.get(url, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         Accept: "application/json;odata=verbose",
  //         "Content-Type": "application/json;odata=verbose",
  //       },
  //     });
  //     return true;
  //   } catch (err) {
  //     return false;
  //   }
  // }

  // async createFolder(serverRelativeUrl: string, token: any) {
  //   try {
  //     const url = `${environment.SharedFilePath}/sites/${environment.SharePointAppName}/_api/web/folders`;
  //     const body = JSON.stringify({
  //       __metadata: { type: "SP.Folder" },
  //       ServerRelativeUrl: `Shared Documents/${serverRelativeUrl}`,
  //     });
  //     const res = await axios.post(url, body, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         Accept: "application/json; odata=verbose",
  //         "Content-Type": "application/json; odata=verbose",
  //       },
  //     });
  //     return true;
  //   } catch (err) {
  //     return false;
  //   }
  // }

  // async ensureFolderExists(serverRelativeUrl: string, token: any) {
  //   const fileFount = await this.checkFolderExists(serverRelativeUrl, token);
  //   if (!fileFount) {
  //     return await this.createFolder(serverRelativeUrl, token);
  //   } else {
  //     return true;
  //   }
  // }

  getSharePointToken(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/fileTransaction/getOAuthToken`);
  }

  async uploadFile(createFilePath: string, token: string, form: any): Promise<any> {
    try {
      const filePath = `${environment.SharedFilePath}/sites/${environment.SharePointAppName}/_api/web/GetFolderByServerRelativeUrl('/sites/${environment.SharePointAppName}/Shared Documents/${createFilePath}')/files/add(url='${form.name}',overwrite=true)`;

      const filesBuffer = await form.arrayBuffer();
      let x: any = [];
      x = new Uint8Array(filesBuffer);

      const response = await axios.post(filePath, x, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/octet-stream",
        },
      });

      if (response.status === 200) {
        return { data: filePath, status: response.status, UniqueId: response.data.d.UniqueId };
      } else {
        console.error("Failed to upload file:", response.statusText);
        return response.statusText;
      }
      //  });
    } catch (error) {
      console.error("An error occurred during file upload:", error);
      return 500;
    }
  }
  getFileFromSharePoint(data: any) {
    return this.http.post<Blob>(`${this.apiUrl}/fileTransaction/sharePointDownload`, data, { responseType: "blob" as "json" });
  }
  downloadFile(fileBlob: Blob, fileName: string) {
    const mimeType = this.getMimeType(fileName);

    // Create a new Blob with the correct MIME type
    const blob = new Blob([fileBlob], { type: mimeType });

    // Create a link element and trigger the download
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();

    // Clean up
    window.URL.revokeObjectURL(link.href);
  }

  getMimeType(fileName: string): string {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "txt":
        return "text/plain";
      case "pdf":
        return "application/pdf";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "doc":
        return "application/msword";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "xls":
        return "application/vnd.ms-excel";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "csv":
        return "text/csv";
      default:
        return "application/octet-stream"; // Default MIME type
    }
  }

  getFileFromDoubee(data: any) {
    return this.http.post<Blob>(`${this.apiUrl}/fileTransaction/docubeeDownload`, data, { responseType: "blob" as "json" });
  }
  convertDocToPdf(formData: FormData): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/fileTransaction/convertToPdf`, formData, {
      responseType: "blob",
    });
  }


  uploadFileToStorage(data: any): Observable<any> {


    return this.http.post(`${this.fileStorageServiceUrl}/api/upload`, data);
  }

  getFileFromStorage(downloadRequest: any): Observable<Blob> {
    return this.http.post(`${this.fileStorageServiceUrl}/api/file/*`, downloadRequest, {
      responseType: 'blob'
    });
  }
  getFileFromDownloadStorage(downloadRequest: any): Observable<Blob> {
    return this.http.post(`${this.fileStorageServiceUrl}/api/file/download`, downloadRequest, {
      responseType: 'blob'
    });
  }


}
