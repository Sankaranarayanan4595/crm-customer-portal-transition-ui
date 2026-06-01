import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";
@Injectable({
  providedIn: 'root'
})
export class CommonService {
  private http = inject(HttpClient);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);


  constructor() { }
  private apiUrl = environment.CRM_ApiUrl;

  updateProductStatus(productId: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/updateProductStatus/${productId}`);
  }
}
