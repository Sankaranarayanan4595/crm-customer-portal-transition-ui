import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, firstValueFrom, Observable } from "rxjs";
import { environment } from "../../environments/environment";

interface AddBillingResponse {
  success: boolean;
  message: string;
  invoicePeriod: string;
  accountDetails: any;
  draft?: any;
  history?: any;
}

@Injectable({
  providedIn: "root",
})
export class OpportunitiesService {
  private http = inject(HttpClient);
  private apiUrl = environment.CRM_ApiUrl;

  private newOpportunityListSubject = new BehaviorSubject<any>(null);
  newOpportunityList$ = this.newOpportunityListSubject.asObservable();

  setNewOpportunityList(data: any) {
    this.newOpportunityListSubject.next(data);
  }

  getNewOpportunityList() {
    return this.newOpportunityListSubject.value;
  }

  clearNewOpportunityList() {
    this.newOpportunityListSubject.next(null);
  }

  createNewLeadOpportunity(data: any): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/opportunities/createNewLeadOpportunity`, data));
  }

  updateLeadOpportunity(opportunityId: string, data: any): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/opportunities/updateLeadOpportunity/${opportunityId}`, data)
    );
  }

  updateLeadOpportunityWithLineItem(opportunityId: string, data: any): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/opportunities/updateLeadOpportunityWithLineItem/${opportunityId}`, data)
    );
  }

  updateForecastForLineItem(opportunityId: string, lineItemId: string, forecasting: any): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(
        `${this.apiUrl}/opportunities/updateForecastForLineItem/${opportunityId}/line-item/${lineItemId}/forecast`,
        { forecasting }
      )
    );
  }

  updateUnifiedNotificationid(opportunityId: string, data: any): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/opportunities/updateUnifiedNotificationid/${opportunityId}`, data)
    );
  }

  getLeadOpportunitySources(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/opportunities/getLeadOpportunitySources`);
  }

  getOppoData(opportunityName: string, excludeId?: string): Observable<any> {
    let url = `${this.apiUrl}/opportunities/getOppoByName/${encodeURIComponent(opportunityName)}`;
    if (excludeId) {
      url += `?excludeId=${excludeId}`;
    }
    return this.http.get(url);
  }

  getOpportunityDetails(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/opportunities/getOpportunityDetails`));
  }

  /**
   * Server-side paginated fetch. Returns { data, pagination }.
   * Falls back to full dataset when page/limit are not provided.
   */
  getOpportunityDetailsPaginated(
    page: number,
    limit: number,
    filters: {
      search?: string | undefined;
      createdBy?: string | undefined;
      status?: string | undefined;
      subStatus?: string | undefined;
    } = {}
  ): Promise<any> {
    let params = new HttpParams().set("page", page.toString()).set("limit", limit.toString());

    if (filters.search) {
      params = params.set("search", filters.search);
    }
    if (filters.createdBy) {
      params = params.set("createdBy", filters.createdBy);
    }
    if (filters.status) {
      params = params.set("status", filters.status);
    }
    if (filters.subStatus) {
      params = params.set("subStatus", filters.subStatus);
    }

    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/opportunities/getOpportunityDetails`, { params }));
  }

  opportunitydetailsbyId(opportunityId: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/opportunities/opportunitydetailsbyId/${opportunityId}`));
  }

  getProductDetailsByOpportunityId(opportunityId: string): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/opportunities/opportunity/${opportunityId}/product-details`));
  }

  getOpportunitiesWithProductsByAccountID(accountId: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/opportunities/getOpportunitiesWithProductsByAccountID/${accountId}`)
    );
  }

  getREOpportunitiesWithProductsByAccountID(accountId: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/opportunities/getREOpportunitiesWithProductsByAccountID/${accountId}`)
    );
  }

  getREProductsBySubClassId(subId: string, accId: any): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/opportunities/getREProductsBySubClassId/${subId}/${accId}`)
    );
  }

  getOpportunitiesWithProductsByAccountIDDelete(accountId: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/opportunities/getOpportunitiesWithProductsByAccountIDDelete/${accountId}`)
    );
  }

  getREDraftsById(draftId: string) {
    return this.http.get<any>(`${this.apiUrl}/opportunities/getREDraftsById/${draftId}`);
  }

  getREDraftsByIdForApproval(draftId: string) {
    return this.http.get<any>(`${this.apiUrl}/opportunities/getREDraftsByIdForApproval/${draftId}`);
  }

  ChangeCompanyStatus() {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/tasks/ChangeCompanyStatus`));
  }

  uploadProductViaExcel(formData: FormData): Promise<any> {
    return firstValueFrom(this.http.post<any>(`${this.apiUrl}/tasks/uploadProductViaExcel`, formData));
  }

  addBillingLinesFromOpportunity(payload: any) {
    return this.http.post<AddBillingResponse>(`${this.apiUrl}/invoice/AddBillingLinesfromOpportunity`, payload);
  }

  markRejectionLogsAsRead(draftid: string[]) {
    return this.http.post<any>(`${this.apiUrl}/invoice/markRejectionLogsAsRead/${draftid}`, {});
  }

  checkAccountApprovalSetting(id: any, subclassId: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/opportunities/checkAccountApprovalSetting/${id}/${subclassId}`);
  }
}
