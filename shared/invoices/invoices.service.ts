import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { BehaviorSubject } from "rxjs";
import { Observable } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class InvoicesService {
  private http = inject(HttpClient);

  private apiUrl = environment.CRM_ApiUrl;
  public sqlFormData = new BehaviorSubject<any>(null);
  public messageSource = new BehaviorSubject<any>(false);
  public invoiceSource = new BehaviorSubject<any>(false);

  public dashValue = new BehaviorSubject<any>(null);

  constructor(...args: unknown[]);

  constructor() {}

  createREDraftInvoice(data: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/invoice/createREDraftInvoice`, data));
  }

  createREDraftBillingRows(draftid: string, data: any): Promise<any> {
    return lastValueFrom(this.http.patch<any>(`${this.apiUrl}/invoice/createREDraftBillingRows/${draftid}`, data));
  }
  saveEmailTemplatesForDraft(draftId: string, emailTemplates: any[]): Promise<any> {
    return lastValueFrom(
      this.http.patch<any>(`${this.apiUrl}/invoice/saveEmailTemplatesForDraft/${draftId}`, {
        emailTemplates: emailTemplates,
      })
    );
  }
  createRESendToApprovalBillingRows(data: any) {
    return this.http.post<any>(`${this.apiUrl}/invoice/createRESendToApprovalBillingRows`, data);
  }

  ensureFolderExists(url: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/ensureFolderExists/${url}`);
  }
  uploadFile(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invoice/uploadFile/`, data);
  }

  getInvoiceApprovalHistoryList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getInvoiceApprovalHistoryList`);
  }
  getAllREApprovalRequests(page: number = 1, limit: number = 0, searchTerm: string = ""): Observable<any> {
    let params = new HttpParams().set("page", page.toString()).set("limit", limit.toString());
    if (searchTerm) params = params.set("searchTerm", searchTerm);
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllREApprovalRequests`, { params });
  }
  getAllREFinalApprovalRequests(page: number = 1, limit: number = 0, searchTerm: string = ""): Observable<any> {
    let params = new HttpParams().set("page", page.toString()).set("limit", limit.toString());
    if (searchTerm) params = params.set("searchTerm", searchTerm);
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllREFinalApprovalRequests`, { params });
  }
  approveOrRejectREInvoiceRequest(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/invoice/approveOrRejectREInvoiceRequest`, data);
  }
  setFormData(formData: any) {
    this.sqlFormData.next(formData);
  }

  message$ = this.messageSource.asObservable();
  sendMessage(message: any) {
    if (this.messageSource.getValue() !== message) {
      this.messageSource.next(message);
    }
  }

  dashValue$ = this.dashValue.asObservable();
  dashValueFn(message: any) {
    if (this.dashValue.getValue() !== message) {
      this.dashValue.next(message);
    }
  }

  messageToHistory$ = this.invoiceSource.asObservable();
  sendMessageTabs(message: any) {
    if (this.invoiceSource.getValue() !== message) {
      this.invoiceSource.next(message);
    }
  }

  getDefaultCompanyInfo(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/invoice/getDefaultCompanyInfo`));
  }

  getInoviceLogById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getInoviceLogById/${id}`);
  }

  getLogPreviewInvoiceById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getLogPreviewInvoiceById/${id}`);
  }
  checkInvoiceLastApproverAuthorization(id: string) {
    return this.http.get<any>(`${this.apiUrl}/invoice/checkInvoiceLastApproverAuthorization/${id}`);
  }
  getREInvoiceBillingDraft(page?: number, limit?: number, search?: string): Observable<any> {
    let params = new HttpParams();
    if (page !== undefined && page !== null) {
      params = params.set("page", page.toString());
    }
    if (limit !== undefined && limit !== null) {
      params = params.set("limit", limit.toString());
    }
    if (search !== undefined && search !== null && search !== "") {
      params = params.set("search", search);
    }
    return this.http.get<any>(`${this.apiUrl}/invoice/getREInvoiceBillingDraft`, { params });
  }
  getREDrafts(cDraftType?: string, page: number = 1, limit: number = 0, currentFilters: any = {}): Observable<any> {
    let url = `${this.apiUrl}/invoice/getREDrafts`;
    let params = new HttpParams().set("page", page.toString()).set("limit", limit.toString());

    if (currentFilters?.searchTerm) params = params.set("searchTerm", currentFilters.searchTerm);
    if (cDraftType) params = params.set("cDraftType", cDraftType);

    // Add additional filters for pagination and searching
    if (currentFilters?.accountName) params = params.set("accountName", currentFilters.accountName);
    if (currentFilters?.billingMonth) params = params.set("billingMonth", currentFilters.billingMonth);
    if (currentFilters?.oAccountManagerUserId)
      params = params.set("oAccountManagerUserId", currentFilters.oAccountManagerUserId);
    if (currentFilters?.myList) params = params.set("myList", currentFilters.myList);

    return this.http.get<any>(url, { params });
  }

  getREDraftsWithComments(draftId: string, cInvoiceDuration?: string): Observable<any> {
    let url = `${this.apiUrl}/invoice/getREDraftsWithComments/${draftId}`;

    // Add cInvoiceDuration as query parameter if provided
    if (cInvoiceDuration) {
      url += `?cInvoiceDuration=${encodeURIComponent(cInvoiceDuration)}`;
    }

    return this.http.get<any>(url);
  }
  getAllInvoiceListsByAccountId(
    id: any,
    page: number = 1,
    limit: number = 0,
    searchTerm: string = ""
  ): Observable<any> {
    let params = new HttpParams().set("page", page.toString()).set("limit", limit.toString());
    if (searchTerm) params = params.set("searchTerm", searchTerm);
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllInvoiceListsByAccountId/${id}`, { params });
  }
  getAllInvoiceLists(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllInvoiceLists`);
  }
  createApprovedInvoices(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/invoice/createApprovedInvoices`, payload);
  }
  sendMailToClient(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/invoice/sendMailToClient`, payload);
  }
  uploadInvoiceToSharePoint(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/invoice/uploadInvoiceToSharePoint`, payload);
  }
  PostApprovedInvoiceToNetSuite(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/invoice/PostApprovedInvoiceToNetSuite`, payload);
  }
  PostAllApprovedInvoiceToNetSuite(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/invoice/PostAllApprovedInvoiceToNetSuite`, payload);
  }

  settingsMappedToInvoice(companyId: any, oSubClass?: string): Observable<any> {
    let url = `${this.apiUrl}/invoice/settingsMappedToInvoice/${companyId}`;

    if (oSubClass) {
      url += `?oSubClass=${encodeURIComponent(oSubClass)}`;
    }

    return this.http.get<any>(url);
  }

  notificationForBillingLines(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/notificationForBillingLines/state/${token}`);
  }

  getREInvoiceDataById(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getRealEstateInvoiceLogByDraftId/${id}`);
  }

  getREDraftsById(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/opportunities/getREDraftsById/${id}`);
  }
  getInvoicesById(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/opportunities/getInvoicesById/${id}`);
  }

  createCreditMemoFromInvoice(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/credit-memo/createFromInvoice`, data);
  }
  getCreditMemos(page: number = 1, limit: number = 0, search: string = ""): Observable<any> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("limit", limit.toString());
    if (search) {
      params = params.set("search", search);
    }
    return this.http.get<any>(`${this.apiUrl}/credit-memo/getCreditMemos`, { params });
  }
  getREDraftAccountList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/credit-memo/getREDraftAccountList`);
  }
  getREAccountDrafts(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/credit-memo/getREAccountDrafts/${id}`);
  }
  createApprovedCreditMemos(payload: any) {
    return this.http.post<any>(`${this.apiUrl}/credit-memo/createApprovedCreditMemos`, payload);
  }
}
