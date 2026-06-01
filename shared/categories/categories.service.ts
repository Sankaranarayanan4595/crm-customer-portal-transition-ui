import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, catchError, Observable, of } from "rxjs";
import { lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";

@Injectable({
  providedIn: "root",
})
export class CategoriesService {
  private http = inject(HttpClient);

  private apiUrl = environment.CRM_ApiUrl;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  getCategories(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/categories/`));
  }
  getCategoriesbyUserCompany(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCategoriesbyUserCompany`));
  }
  getCompanies(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/companies/`));
  }
  getProducts(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/products`));
  }
  getProductswithcategory(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getProductsWithCategory/`));
  }
  getRoles(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/roles`));
  }
  getCategoriesFilter(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/categoriesFilter/`));
  }
  getCompaniesFilter(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/companiesFilter/`));
  }

  getProductsFilter(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/productsFilter/`));
  }
  getUsers(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/users`));
  }
  getUsersParentFilter(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getUsersParentFilter`));
  }
  getAllUsers(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/usersAll`));
  }
  getSatuses(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/statuses`));
  }
  getStatusesOpportunity(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getStatusesOpportunity`));
  }

  getStatusesTasks(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getStatusesTasks`));
  }

  getStatusesTeams(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getStatusesTeams`));
  }

  getDocumentsbyCategory(catId: string): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getDocumentsbyCategory/${catId}`));
  }
  getProductsByCategory(catId: string): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/productsbyCategory/${catId}`));
  }

  getProductsCategoryFilter(categoryIds: string[]): Promise<any[]> {
    return lastValueFrom(
      this.http.post<any[]>(`${this.apiUrl}/customerService/getProductsCategoryFilter`, {
        categoryIds,
      })
    );
  }

  checkProductForCompany(data: any): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/checkProductForCompany`, data));
  }
  getProfileDetails(actId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getCompanyDetails/${actId}`);
  }
  updateProfile(actId: string | null, profileData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/customerService/updateProfile/${actId}`, profileData);
  }

  saveDocumentDetails(document: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/saveDocumentDetails`, document);
  }
  saveEsignMailToClient(id: string, document: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/saveEsignMailToClient/${id}`, document);
  }

  // saveEsignDocumentDetails(compID: string,document: any): Observable<any> {
  //   return this.http.post<any>(`${this.apiUrl}/customerService/saveEsignDocumentDetails/${compID}`, document);
  // }

  saveEsignDocumentDetailstoQueue(document: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/saveEsignDocumentDetailstoQueue`, document).pipe(
      catchError((error) => {
        // Convert the error into a fake "response"
        return of({
          success: false,
          message: error?.error?.message || "Server error",
          status: error.status,
        });
      })
    );
  }

  saveEsignDocumentDetails(document: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/saveEsignDocumentDetails`, document).pipe(
      catchError((error) => {
        // Convert the error into a fake "response"
        return of({
          success: false,
          message: error?.error?.message || "Server error",
          status: error.status,
        });
      })
    );
  }

  addCustomerDetails(customer: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/addCustomer`, {
      customer: customer,
    });
  }

  // getCompanyData(companyName: string): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/customerService/company/${companyName}`);
  // }
  getCompanyData(companyName: string, parentname: string, excludeId?: string): Observable<any> {
    let url = `${this.apiUrl}/customerService/company/${companyName}/${parentname}`;
    if (excludeId) {
      url += `?excludeId=${excludeId}`;
    }
    return this.http.get(url);
  }
  getCompanyCode(companycode: string, excludeId?: string): Observable<any> {
    let url = `${this.apiUrl}/customerService/getCompanyCode/${companycode}`;
    if (excludeId) {
      url += `?excludeId=${excludeId}`;
    }
    return this.http.get(url);
  }
  getOtherDetailsForCompany(Id: string): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getOtherDetailsForCompany/${Id}`));
  }
  saveOrUpdateOtherDetailsForCompany(companyId: string, Data: any): Promise<any> {
    return lastValueFrom(
      this.http.post(`${this.apiUrl}/customerService/saveOrUpdateOtherDetailsForCompany/${companyId}`, Data)
    );
  }

  getCompanyNickData(companyName: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/getCompanyNickData/${companyName}`);
  }
  checkEmail(email: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/customerService/checkEmail/${email}`);
  }

  getAddressByZipCode(zipCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/AddressFinder`, {
      ZIPCode: zipCode,
    });
  }
  checkCombination(companyName: string, categoryId: string, productId: string, email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/customerService/checkCombination`, {
      companyName,
      categoryId,
      productId,
      email,
    });
  }

  getAllCustomerList(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getAllCustomerDetails/`));
  }

  getProductsGrp(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getProductsGrp/`));
  }
  getCompanyDeatilsByID(Id: string | null): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanyDeatilsByID/${Id}`));
  }
  getProductsGrpCountry(Id: string | null): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getProductsGrpCountry/${Id}`));
  }
  DeleteCompanyContactDetails(currentCompID: any, data: any): Promise<any> {
    return lastValueFrom(
      this.http.post(`${this.apiUrl}/customerService/DeleteCompanyContactDetails/${currentCompID}`, data)
    );
  }
  getContactDetails(companyId: string | null) {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanyContactsDetails/${companyId}`));
  }

  getAllContactDetails(page?: number, limit?: number) {
    let params = new HttpParams();
    if (page !== undefined && limit !== undefined) {
      params = params.set('page', page.toString()).set('limit', limit.toString());
    }
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCompanyAllContactsDetails`, { params }));
  }

  searchContacts(search: string, page: number, limit: number) {
    const params = new HttpParams()
      .set('search', search)
      .set('page', page.toString())
      .set('limit', limit.toString());
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/searchContacts`, { params }));
  }
  // saveCompanyContactsDetails(companyId: string | null, contactDetail: any): Promise<any> {
  //   return lastValueFrom(this.http.post<any>(`${this.apiUrl}/customerService/saveCompanyContactsDetails/${companyId}`, contactDetail));
  // }

  saveCompanyContactsDetails(companyId: string | null, contactDetail: any): Promise<any> {
    const url = companyId
      ? `${this.apiUrl}/customerService/saveCompanyContactsDetails/${companyId}`
      : `${this.apiUrl}/customerService/saveCompanyContactsDetails`;
    return lastValueFrom(
      this.http.post<any>(url, contactDetail).pipe(
        catchError((error) => {
          // HTTP 400 with type EMAIL_EXISTS is an expected business-logic response,
          // not a fatal error — return it as a resolved value so the caller can
          // display the duplicate-email confirmation modal.
          if (error?.status === 400 && error?.error?.type === "EMAIL_EXISTS") {
            return of({ ...error.error, duplicate: true });
          }
          // Re-throw all other errors as normal
          throw error;
        })
      )
    );
  }

  updateContactDetails(Id: string, profileData: any): Promise<any> {
    return lastValueFrom(this.http.put<any>(`${this.apiUrl}/customerService/updateContactDetails/${Id}`, profileData));
  }

  capitalizeFirstLetter(str: string): string {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  private manageProductListSubject = new BehaviorSubject<any[]>([]);
  private productListSubject = new BehaviorSubject<any[]>([]);

  // Expose the subjects as observables
  productList$ = this.productListSubject.asObservable();
  manageProductList$ = this.manageProductListSubject.asObservable();

  // Set the product list
  setProductList(products: any[]) {
    this.productListSubject.next(products);
  }

  // Clear the product list
  clearProductList() {
    this.productListSubject.next([]);
  }

  // Set the manage product list
  setManageProductList(products: any[]) {
    this.manageProductListSubject.next(products);
  }

  // Clear the manage product list
  clearManageProductList() {
    this.manageProductListSubject.next([]);
  }

  private fteValuesSubject = new BehaviorSubject<any[]>([]);
  fteValues$ = this.fteValuesSubject.asObservable();
  setFteValues(newValues: any[]) {
    // Check if fteValuesSubject currently has values
    const currentValues = this.fteValuesSubject.getValue();

    // If not empty, push the new values to the existing array
    if (currentValues && currentValues.length > 0) {
      this.fteValuesSubject.next([...currentValues, ...newValues]);
    } else {
      // If empty, set with new values
      this.fteValuesSubject.next(newValues);
    }
  }

  clearFteValues() {
    this.fteValuesSubject.next([]);
  }

  getFteValues(): any[] {
    return this.fteValuesSubject.getValue();
  }

  // subscription

  private subscriptionValuesSubject = new BehaviorSubject<any[]>([]);
  subscriptionValues$ = this.subscriptionValuesSubject.asObservable();
  setSubscriptionValues(newValues: any[]) {
    // Check if subscriptionValuesSubject currently has values
    const currentValues = this.subscriptionValuesSubject.getValue();

    // If not empty, push the new values to the existing array
    if (currentValues && currentValues.length > 0) {
      this.subscriptionValuesSubject.next([...currentValues, ...newValues]);
    } else {
      // If empty, set with new values
      this.subscriptionValuesSubject.next(newValues);
    }
  }

  clearSubscriptionValues() {
    this.subscriptionValuesSubject.next([]);
  }

  getSubscriptionValues(): any[] {
    return this.subscriptionValuesSubject.getValue();
  }

  isValidDate(selectedFrequency: any, newFromDate: any, newEndDate: any) {
    const frequencyNumber = parseInt(selectedFrequency?.frequencyCycle ?? 1);
    const fromDates = new Date(newFromDate);
    const endDates = new Date(newEndDate);
    const differenceInDays = (endDates.getTime() - fromDates.getTime()) / (1000 * 60 * 60 * 24);
    const expectedDays = frequencyNumber * 30;
    if (differenceInDays >= expectedDays) {
      return false;
    } else {
      return true;
    }
  }

  getCardStatuses(type: any): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/customerService/getCardStatuses/${type}`));
  }
}
