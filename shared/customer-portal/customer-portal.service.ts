import { Injectable, inject } from '@angular/core';
import { environment } from "../../environments/environment";
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CustomerPortalService {
  private http = inject(HttpClient);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);


  constructor() { }
  private apiUrl = environment.CRM_Transition_ApiUrl;
  private profileData: any = null;

  getInvoicesCustomer() {
    return this.http.get(`${this.apiUrl}/customerPortal/getInvoicesCustomer`);
  }
  getInvoicesCustomerById(prodId: string) {
    return this.http.get(`${this.apiUrl}/customerPortal/getInvoicesCustomerById/${prodId}`);
  }
  getPaymentInvoicesCustomer() {
    return this.http.get(`${this.apiUrl}/customerPortal/getPaymentInvoicesCustomer`);
  }
  getCustomerPaymentInvoicesById(id: any) {
    return this.http.get(`${this.apiUrl}/customerPortal/getCustomerPaymentInvoicesById/${id}`);
  }
  getCompanyDetails() {
    return this.http.get(`${this.apiUrl}/customerPortal/getCompanyDetails`);
  }
  getProductsCustomer() {
    return this.http.get(`${this.apiUrl}/customerPortal/getProductsCustomer`);
  }
  getCustomerDetails() {
    return (this.http.get<any>(`${this.apiUrl}/customerPortal/getCustomerDetails`));
  }
  updateCustomerDetails(profileData: any) {
    return (this.http.patch(`${this.apiUrl}/customerPortal/updateCustomerDetails`, profileData));
  }
  AddSubscriptionProduct(profileData: any) {
    return (this.http.post(`${this.apiUrl}/customerPortal/AddSubscriptionProduct`, profileData));
  }

  setProfileData(data: any): void {
    this.profileData = data;
  }
  getProfileData(): any {
    return this.profileData;
  }
  getAllDepartmentsBactiveCustomerPortal() {
    return this.http.get(`${this.apiUrl}/customerPortal/getAllDepartmentsBactiveCustomerPortal`);
  }

  // Razerpay/Stripe payment methods removed — P0 security: client-supplied payment secrets (CWE-798)


  loadCustomerTransition(roleName: any) {
    return this.http.get(`${this.apiUrl}/customerPortal/loadCustomerTransition/${roleName}`);
  }
  getCardStatusesTransition(type: string) {
    return this.http.get(`${this.apiUrl}/customerPortal/getCardStatusesTransition/${type}`);
  }
  checkTransitionCustomerRole(id: string) {
    return this.http.get(`${this.apiUrl}/customerPortal/checkTransitionCustomerRole/${id}`);
  }
  loadClientProducts() {
    return this.http.get(`${this.apiUrl}/customerPortal/loadClientProducts`);
  }
  loadCustomerApproval() {
    return this.http.get(`${this.apiUrl}/customerPortal/loadCustomerApproval`);
  }

  upsertCustomerConfigration(data: any) {
    return (this.http.post(`${this.apiUrl}/customerPortal/upsertCustomerConfigration`, data));
  }
}
