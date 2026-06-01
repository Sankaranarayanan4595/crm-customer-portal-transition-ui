import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { promises } from "dns";
import { ids } from "webpack";

@Injectable({
  providedIn: 'root'
})
export class TicketingTaskService {
  private apiUrl = environment.CRM_ApiUrl;

  constructor() { }
}
