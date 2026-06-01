import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private http = inject(HttpClient);

  private apiUrl = environment.CRM_ApiUrl;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }
  sendEmailRequestActivation(productId: string): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/fileTransaction/sendEmailRequestActivation/${productId}`, {}));
  }
  updateStatus(productId: string): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/fileTransaction/updateStatus/${productId}`));
  }
}
