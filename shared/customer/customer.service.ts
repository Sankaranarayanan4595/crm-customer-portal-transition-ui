import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})

export class CustomerService {
  private http = inject(HttpClient);

  private apiUrl = environment.CRM_ApiUrl;
  contractId!: any;
  prospectId!: any;
  activeId!: any;
  inactiveId!: any;
  transitionId!: any;
  DocumentEndStatus!: any;
  recategoryid!: any

  getCompanyFilter(data: any): Promise<any> {
    let params = new HttpParams();

    // for (const key in data) {
    //   if (data.hasOwnProperty(key) && data[key] !== undefined && data[key] !== null) {
    //     params = params.append(key, data[key]);
    //   }
    // }
    for (const key in data) {
      if (data.hasOwnProperty(key) && data[key] !== undefined && data[key] !== null) {
        if (Array.isArray(data[key])) {
          data[key].forEach((item: any) => {
            params = params.append(key, item);
          });
        } else {
          params = params.append(key, data[key]);
        }
      }
    }

    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompaniesFilterlist/`, { params }));
  }
  // getCompany(): Promise<any> {
  //   return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanieslist/`));
  // }
  getCompany(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanieslist`));
  }
  getCompanyAdditionalSettings(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanieslistAddSettings`));
  }
  getCompanyAdditionalSettingsById(): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getCompanyAdditionalSettingsById`);
  }
  SyncAllCustomerQuickbook(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/SyncAllCustomerQuickbook`);
  }

  deleteCustomerDashboard(companyId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customerService/deleteCompanyAndCustomers/${companyId}`);
  }
  getDocumentDetailsList(companyId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getDocumentDetailsList/${companyId}`);
  }
  getDocumentDetailsListbyOpportunity(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getDocumentDetailsListbyOpportunity/${id}`);
  }
  getContractDocumentList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getContractDocumentList`);
  }
  UpdateDocumentDetailsList(documentId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/customerService/UpdateDocumentDetailsList/${documentId}`, data);
  }
  UpdateDocumentDetails(documentId: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/customerService/UpdateDocumentDetails/${documentId}`, data);
  }

  getCompanyNamesAndEmails(companyId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getCompanyNamesAndEmails/${companyId}`);
  }
  getCompaniesFilter(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/companiesFilter/`));
  }
  addCompany(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/customerService/addCompany`, data));
  }

  getCompanyProductList(data: any): Promise<any> {
    let params = new HttpParams();
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        params = params.set(key, data[key]);
      }
    }

    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanyProductList/`, { params }));
  }
  getProductDetails(ids: any[]): Promise<any> {
    if (!ids || ids.length === 0) {
      return Promise.reject("Invalid or empty IDs array");
    }
    const idsString = ids.map((id) => id._id).join(",");

    // let params = new HttpParams();
    // ids.forEach(id => {
    //   params = params.append('ids', id._id);
    // });
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getProductDetails/${idsString}`));
  }
  addproductstoCompany(id: string, data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/customerService/addproductstoCompany/${id}`, data));
  }
  addaddresstoCompany(id: string, data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/customerService/addaddresstoCompany/${id}`, data));
  }
  getExistingProducsList(id: string | null): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getExistingProducsList/${id}`));
  }
  getExistingProducsListInvoice(comid: string | null, maincomid: string | null, isLastApprover: boolean = false): Promise<any> {
    return lastValueFrom(
      this.http.get<any>(`${this.apiUrl}/invoice/getExistingProducsListInvoice`, {
        params: {
          companyId: comid || "",
          maincompanyId: maincomid || "",
          isLastApprover: isLastApprover || false
        },
      })
    );
  }
  deleteProduct(productId: string): Promise<any> {
    return lastValueFrom(this.http.delete<any>(`${this.apiUrl}/customerService/deleteProduct/${productId}`));
  }
  deactivateProduct(productId: string): Promise<any> {
    return lastValueFrom(this.http.put<any>(`${this.apiUrl}/customerService/deactivateProduct/${productId}`, {}));
  }

  createLeadFollowup(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/createLeadFollowup`, data);
  }

  createClientStatus(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/createClientStatus`, data);
  }
  createOpportunity(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/createOpportunity`, data);
  }

  addleadsCompanyDetails(data: any) {
    return this.http.post<any>(`${this.apiUrl}/customerService/addleadsCompanyDetails`, data);
  }
  convertLeadToClientForUnified(id: string, data: any) {
    return this.http.post<any>(`${this.apiUrl}/customerService/convertLeadToClientForUnified/${id}`, data);
  }

  updateLeadsCompanyDetails(data: any) {
    return this.http.post<any>(`${this.apiUrl}/customerService/updateLeadsCompanyDetails`, data);
  }
  upsertApprovalSetting(data: any) {
    return this.http.post<any>(`${this.apiUrl}/customerService/upsertApprovalSetting`, data);
  }
  checkIfClient(id: any) {
    return this.http.get<any>(`${this.apiUrl}/customerService/checkIfClient/${id}`);
  }
  convertLeadToClient(id: any) {
    return this.http.get<any>(`${this.apiUrl}/customerService/convertLeadToClient/${id}`);
  }
  convertClientToInTransition(id: any) {
    return this.http.get<any>(`${this.apiUrl}/customerService/convertClientToInTransition/${id}`);
  }

  getLeadFollowupsForCompany(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/getLeadFollowupsForCompany/${id}`);
  }
  GetdocumentLogs(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/GetdocumentLogs/${id}`);
  }
  getloadopportunitiesCompany(id: any, type: any): Observable<any> {
    const params = new HttpParams().set('type', type);
    return this.http.get<any>(`${this.apiUrl}/customerService/getloadopportunitiesCompany/${id}`, { params });
  }
  getCompanyStatusHistory(id: any, type: any): Observable<any> {
    const params = new HttpParams().set('type', type);
    return this.http.get<any>(`${this.apiUrl}/customerService/getCompanyStatusHistory/${id}`, { params });
  }



  updateLeadFollowup(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/customerService/updateLeadFollowup`, data);
  }

  updateDocumentStatus(id: string, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/customerService/updateDocumentStatus/${id}`, data);
  }


  deleteLeadFollowup(id: any): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/customerService/deleteLeadFollowup/${id}`);
  }


  deleteOpportunity(id: any, type: string, compid: string): Observable<any> {
    const params = new HttpParams()
      .set('type', type)
      .set('index', JSON.stringify(compid));

    return this.http.delete<any>(`${this.apiUrl}/customerService/deleteOpportunity/${id}`, { params });
  }


  saveProductSettings(payload: any) {
    return this.http.patch<any>(`${this.apiUrl}/customerService/saveProductSettings`, payload);
  }
  saveCompanySettings(payload: any) {
    return this.http.patch<any>(`${this.apiUrl}/customerService/saveCompanySettings`, payload);
  }
  saveCompanyAdditionalSettings(payload: any) {
    return this.http.patch<any>(`${this.apiUrl}/customerService/saveCompanyAdditionalSettings`, payload);
  }
  validateCurrentApprovers(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/customerService/validateCurrentApprovers`, payload);
  }
  //Accounts
  getAccountList(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getAccountList`));
  }

  /**
   * Server-side paginated fetch. Returns { data, pagination }.
   * Falls back to full dataset when page/limit are not provided.
   */
  getAccountListPaginated(page: number, limit: number, filters: any = {}): Promise<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
        params = params.set(key, filters[key].toString());
      }
    });

    return lastValueFrom(
      this.http.get<any>(`${this.apiUrl}/customerService/getAccountList`, { params })
    );
  }

  searchAccounts(searchTerm: string, page: number, limit: number, filters: any = {}): Promise<any> {
    let params = new HttpParams()
      .set('search', searchTerm)
      .set('page', page.toString())
      .set('limit', limit.toString());

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
        params = params.set(key, filters[key].toString());
      }
    });

    return lastValueFrom(
      this.http.get<any>(`${this.apiUrl}/customerService/searchAccounts`, { params })
    );
  }

  getAccountCounts(filters: any = {}): Promise<any> {
    let params = new HttpParams();

    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
        params = params.set(key, filters[key].toString());
      }
    });

    return lastValueFrom(
      this.http.get<any>(`${this.apiUrl}/customerService/getAccountCounts`, { params })
    );
  }

  getAllAccountDetails(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/getAllAccountDetails`);
  }
  getAccountDetailsbyId(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/getAccountDetailsbyId/${id}`);
  }
  loadExistingApprovalSetting() {
    return this.http.get<any>(`${this.apiUrl}/customerService/loadExistingApprovalSetting`);
  }

  //#region VIEWS
  // Create View
  createView(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/customerService/createView`, payload);
  }

  // Update View
  updateView(activeViewId: string, payload: any): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/customerService/updateView/${activeViewId}`,
      payload
    );
  }

  // Get Views
  getViews(): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getViews`);
  }

  // Set Default View (optional but recommended)
  setDefaultView(viewId: string): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/customerService/setDefaultView/${viewId}`,
      {}
    );
  }

  // Delete View
  deleteView(viewId: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customerService/deleteView/${viewId}`);
  }

  //#endregion
}
