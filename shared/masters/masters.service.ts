import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import { lastValueFrom } from "rxjs";
import { environment } from "../../environments/environment";
import { industry } from "../interface/masterInterface";
import { portalDetails } from "../interface/masterInterface";
import { CrmSocketService } from "../crm-socket/crm-socket.service";
@Injectable({
  providedIn: "root",
})
export class MastersService {
  private http = inject(HttpClient);
  private socket = inject(CrmSocketService);

  private apiUrl = environment.CRM_ApiUrl;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  //masterroutes

  GetCountries(): Observable<industry> {
    return this.http.get<any>(`${this.apiUrl}/master/GetCountries`);
  }

  // SyncAllCategoryQuickbook(): Observable<industry> {
  //   return this.http.get<any>(`${this.apiUrl}/master/SyncAllCategoryQuickbook`);
  // }
  getAllCategories(): Observable<industry> {
    return this.http.get<any>(`${this.apiUrl}/master/allCategories`);
  }
  getAciveCategories(): Observable<industry> {
    return this.http.get<any>(`${this.apiUrl}/master/getAciveCategories`);
  }
  createCategories(categorydata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/master/createCategories`, categorydata);
  }
  updateCategories(id: string, categorydata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/master/updateCategories/${id}`, categorydata);
  }
  deleteCategories(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/master/deleteCategories/${id}`);
  }

  getAllPortal(): Observable<portalDetails> {
    return this.http.get<any>(`${this.apiUrl}/master/allPortalDetails`);
  }
  getAllBActiveLeadsPortalDetails(): Observable<portalDetails> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllBActiveLeadsPortalDetails`);
  }
  createPortal(data: any): Observable<portalDetails> {
    return this.http.post<portalDetails>(`${this.apiUrl}/master/createPortalDetails`, data);
  }
  updatePortal(id: string, data: any): Observable<portalDetails> {
    return this.http.patch<portalDetails>(`${this.apiUrl}/master/updatePortalDetails/${id}`, data);
  }
  deletePortal(id: string): Observable<portalDetails> {
    return this.http.delete<portalDetails>(`${this.apiUrl}/master/deletePortalDetails/${id}`);
  }

  getAllLeadsProductCategoryProductMappings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllUserProIndMapTable`);
  }
  syncAllProductsQuickbook(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/syncAllProductsQuickbook`);
  }
  SaveUserProdutMapping(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createLeadsProductCategoryProductMapping`, data);
  }
  updateLeadsProCatUserMapping(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateLeadsProductCategoryProductMapping/${id}`, configdata);
  }
  deleteAllLeadsProCatUserMapping(id: string): Observable<industry> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteLeadsProductCategoryProductMapping/${id}`);
  }

  getAllConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allEsignMailConfigs`);
  }
  createConfig(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/master/createEsignMailConfig`, configdata);
  }
  updateConfig(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/master/updateEsignMailConfig/${id}`, configdata);
  }
  deleteConfig(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/master/deleteEsignMailConfig/${id}`);
  }

  getAllActivationStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allActivationStatuses`);
  }
  getAllActivationStatusByType(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allActivationStatusesByType`);
  }
  createActivationStatus(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/master/createActivationStatus`, configdata);
  }
  updateActivationStatus(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/master/updateActivationStatus/${id}`, configdata);
  }
  deleteActivationStatus(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/master/deleteActivationStatus/${id}`);
  }

  getAllDocumentType(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allDocumentTypes`);
  }
  allActiveDocumentTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allActiveDocumentTypes`);
  }
  createDocumentType(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/master/createDocumentType`, configdata);
  }
  updateDocumentType(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/master/updateDocumentType/${id}`, configdata);
  }
  deleteDocumentType(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/master/deleteDocumentType/${id}`);
  }
  getAllMailTemplates(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allMailTemplates`);
  }
  createMailTemplate(mailTemplateData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createMailTemplate`, mailTemplateData);
  }
  updateMailTemplate(id: string, mailTemplateData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateMailTemplate/${id}`, mailTemplateData);
  }
  deleteMailTemplate(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteMailTemplate/${id}`);
  }
  getAllRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/allRoles`);
  }
  createRoles(rolesdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createRole`, rolesdata);
  }
  updateRoles(id: string, rolesdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateRole/${id}`, rolesdata);
  }
  deleteRoles(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteRole/${id}`);
  }
  getAllIcons(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/icons`);
  }
  getActivationMasterFilter(): Promise<any> {
    return lastValueFrom(this.http.get<any>(`${this.apiUrl}/master/allActivationStatuses`));
  }

  beActiveZeroDocubeeList(_id: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/beActiveDocubeeList/${_id}`, {});
  }
  checkTemplateName(templateName: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/master/checkTemplateName/${templateName}`);
  }
  getUserCompanyList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/UsersCompanyList`);
  }

  getCountryData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/GetCountries`);
  }
  //#region tax and term Master
  getAllTaxes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllTaxes`);
  }
  getAllTaxesBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllTaxesBactive`);
  }
  getBankAccDetails(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getBankAccDetails`);
  }

  getTaxById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getTaxById/${id}`);
  }
  createTax(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/invoice/createTax`, configdata);
  }
  updateTax(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/invoice/updateTax/${id}`, configdata);
  }
  deleteTax(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/invoice/deleteTax/${id}`);
  }
  getAllTerms(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllTerms`);
  }
  getAllTermsBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllTermsBactive`);
  }
  getTermById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getTermById/${id}`);
  }
  createTerm(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/invoice/createTerm`, configdata);
  }
  updateTerm(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/invoice/updateTerm/${id}`, configdata);
  }
  deleteTerm(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/invoice/deleteTerm/${id}`);
  }
  //#endregion

  //#region Addtional Charges
  getAllAdditionalCharges(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllAdditionalCharges`);
  }
  getAllAdditionalChargesBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllAdditionalChargesBactive`);
  }
  getAdditionalChargesById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAdditionalChargesById/${id}`);
  }
  createAdditionalCharges(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/invoice/createAdditionalCharges`, configdata);
  }
  updateAdditionalCharges(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/invoice/updateAdditionalCharges/${id}`, configdata);
  }
  deleteAdditionalCharges(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/invoice/deleteAdditionalCharges/${id}`);
  }
  //#endregion

  //#region Billing Frequency
  getAllBillingFrequency(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllBillingFrequency`);
  }
  getAllBillingFrequencyBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveBillingFrequency`);
  }
  createBillingFrequency(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/master/createBillingFrequecy`, configdata);
  }
  updateBillingFrequency(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/master/updateBillingFrequecy/${id}`, configdata);
  }
  deleteBillingFrequency(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/master/deleteBillingFrequecy/${id}`);
  }
  //#endregion

  //#region CRM AuditLogs

  getAllCRMAuditLogs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllCRMAuditLogs`);
  }

  //#endregion

  //region CRM Payment Mode Master
  getAllPaymentModes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllPaymentModes`);
  }
  getAllPaymentModesBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getAllPaymentModesBactive`);
  }
  getPaymentModesById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/invoice/getPaymentModeById/${id}`);
  }
  createPaymentModes(configdata: any): Observable<industry> {
    return this.http.post<industry>(`${this.apiUrl}/invoice/createPaymentMode`, configdata);
  }
  updatePaymentModes(id: string, configdata: any): Observable<industry> {
    return this.http.patch<industry>(`${this.apiUrl}/invoice/updatePaymentMode/${id}`, configdata);
  }
  deletePaymentModes(id: string): Observable<industry> {
    return this.http.delete<industry>(`${this.apiUrl}/invoice/deletePaymentMode/${id}`);
  }
  //#endregion

  //#region Billing Date Master
  getAllBillingDate(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllBillingDate`);
  }
  getAllBillingDateBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllBillingDateBactive`);
  }
  getBillingDateById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getBillingDateById/${id}`);
  }
  createBillingDate(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createBillingDate`, configdata);
  }
  updateBillingDate(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateBillingDate/${id}`, configdata);
  }
  deleteBillingDate(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteBillingDate/${id}`);
  }
  //#endregion

  //#region User Type Master
  getAllUserType(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllUserType`);
  }
  getAllUserTypeBactiveFTE(): Observable<any> {
    // Hide for Production changes
    // return this.http.get<any>(`${this.apiUrl}/master/getAllUserTypeBactiveFTE`);
    return this.http.get<any>(`${this.apiUrl}/master/getAllUserType`);
  }
  getAllUserTypeBactiveSub(): Observable<any> {
    // return this.http.get<any>(`${this.apiUrl}/master/getAllUserTypeBactiveSub`);
    return this.http.get<any>(`${this.apiUrl}/master/getAllUserType`);
  }
  getUserTypeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getUserTypeById/${id}`);
  }
  createUserType(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createUserType`, configdata);
  }
  updateUserType(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateUserType/${id}`, configdata);
  }
  deleteUserType(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteUserType/${id}`);
  }
  //#endregion
  //#region Department Master
  getAllDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllDepartments`);
  }
  getDepartmentById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getDepartmentById/${id}`);
  }
  getAllActiveDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllDepartmentsBactive`);
  }
  createDepartment(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createDepartment`, configdata);
  }
  updateDepartment(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateDepartment/${id}`, configdata);
  }
  deleteDepartment(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteDepartment/${id}`);
  }
  //#endregion

  //#region TaxType Master
  getAllTaxTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllTaxTypes`);
  }
  getTaxTypeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getTaxTypeById/${id}`);
  }
  getAllTaxTypesBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllTaxTypesBactive`);
  }
  createTaxType(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createTaxType`, configdata);
  }
  updateTaxType(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateTaxType/${id}`, configdata);
  }
  deleteTaxType(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteTaxType/${id}`);
  }
  //#endregion

  //#region Level Master
  getAllLevels(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllLevels`);
  }
  getAllLevelsBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllLevelsBactive`);
  }
  getLevelById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getLevelById/${id}`);
  }
  createLevel(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createLevel`, configdata);
  }
  updateLevel(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateLevel/${id}`, configdata);
  }
  deleteLevel(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteLevel/${id}`);
  }
  //#endregion

  capitalizeFirstLetter(str: string): string {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  // New Portal Changes

  getAllApplication(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllApplication`);
  }
  GetAllPaymentMethods(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/GetAllPaymentMethods`);
  }
  GetAllBActivePaymentMethods(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/GetAllBActivePaymentMethods`);
  }
  GetAllBActivePaymentMethodsForCompany(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/GetAllBActivePaymentMethodsForCompany`);
  }

  //#region Opportunity Type Master
  getAllOpportunityType(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllOpportunityType`);
  }
  getAllOpportunityTypeBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllOpportunityTypeBactive`);
  }
  getOpportunityTypeById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getOpportunityTypeById/${id}`);
  }
  createOpportunityType(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createOpportunityType`, configdata);
  }
  updateOpportunityType(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateOpportunityType/${id}`, configdata);
  }
  deleteOpportunityType(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteOpportunityType/${id}`);
  }
  //#endregion

  getProductMappedtoInvoice(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getProductMappedtoInvoice/${id}`);
  }
  getCompanyMappedtoInvoice(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getCompanyMappedtoInvoice/${id}`);
  }

  //#region Accounts SubClass
  getAllAccountSubClasses(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllSubClass`);
  }
  loadStatusforDeletion(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/loadStatusforDeletion`);
  }

  getFileSizeConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getFileSizeConfig`);
  }

  getAllbActiveAccountSubClasses(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveSubClass`);
  }

  getAccountSubClassById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getSubClass/${id}`);
  }

  getSubClassByCategoryId(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getSubClassByCategoryId/${id}`);
  }

  createAccountSubClass(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createSubClass`, configdata);
  }

  updateAccountSubClass(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateSubClass/${id}`, configdata);
  }

  deleteAccountSubClass(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteSubClass/${id}`);
  }
  //#endregion

  //#region Billing Unit
  getAllBillingUnits(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllBillingUnits`);
  }

  getAllbActiveBillingUnits(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveBillingUnits`);
  }
  getallCompetitiveLandscape(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getallCompetitiveLandscape`);
  }

  createCompetitiveLandscape(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createCompetitiveLandscape`, configdata);
  }

  getAllBillingUnitsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getBillingUnit/${id}`);
  }

  createBillingUnit(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createBillingUnit`, configdata);
  }

  updateBillingUnit(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateBillingUnit/${id}`, configdata);
  }

  deleteBillingUnit(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteBillingUnit/${id}`);
  }
  //#endregion

  //#region contact role
  getAllContactRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllContactRoles`);
  }

  getAllbActiveContactRoles(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveContactRoles`);
  }

  getAllContactRolesById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getContactRole/${id}`);
  }

  createContactRole(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createContactRole`, configdata);
  }

  updateContactRole(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateContactRole/${id}`, configdata);
  }

  deleteContactRole(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteContactRole/${id}`);
  }
  //#endregion

  //#region Product type
  getAllProductTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllProductTypes`);
  }

  getAllbActiveProductTypes(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveProductTypes`);
  }

  getAllProductTypesById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getProductType/${id}`);
  }

  createProductType(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createProductType`, configdata);
  }

  updateProductType(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateProductType/${id}`, configdata);
  }

  deleteProductType(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteProductType/${id}`);
  }
  //#endregion

  //#region Region
  getAllRegions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllRegions`);
  }

  getAllbActiveRegions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveRegions`);
  }

  getAllbActiveCountries(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getCountriesList`);
  }

  getAllRegionsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getRegion/${id}`);
  }

  createRegion(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createRegion`, configdata);
  }

  updateRegion(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateRegion/${id}`, configdata);
  }

  deleteRegion(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteRegion/${id}`);
  }
  //#endregion

  //#region GL Account
  getAllGlAccounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllGlAccounts`);
  }

  getAllbActiveGlAccounts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllActiveGlAccounts`);
  }

  createGlAccount(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createGlAccount`, configdata);
  }

  updateGlAccount(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateGlAccount/${id}`, configdata);
  }

  deleteGlAccount(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteGlAccount/${id}`);
  }
  //#endregion

  //#region Account classification
  getAllAccountClassifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllAccountClassifications`);
  }

  getAllbActiveAccountClassifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveAccountClassifications`);
  }

  getAllAccountClassificationsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAccountClassification/${id}`);
  }

  createAccountClassification(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createAccountClassification`, configdata);
  }

  updateAccountClassification(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateAccountClassification/${id}`, configdata);
  }

  deleteAccountClassification(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteAccountClassification/${id}`);
  }
  //#endregion

  //#region Account source
  getAllAccountSources(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllAccountSources`);
  }

  getAllbActiveAccountSources(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllbActiveAccountSources`);
  }

  getAllAccountSourcesById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAccountSource/${id}`);
  }

  createAccountSource(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createAccountSource`, configdata);
  }

  updateAccountSource(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateAccountSource/${id}`, configdata);
  }

  deleteAccountSource(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteAccountSource/${id}`);
  }
  //#endregion

  //Account Classification
  getAllCRMAccountClassifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllCRMAccountClassifications`);
  }

  //Account source
  getAllCRMAccountSource(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllCRMAccountSource`);
  }

  getAccountCompanyList(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/customerService/getAccountCompanyList`);
  }

  getAllProductDetailsMapTable(page?: number, limit?: number, search?: string): Observable<any> {
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
    return this.http.get<any>(`${this.apiUrl}/master/getAllProductDetailsMapTable`, { params });
  }

  //#region Comments
  getAllComments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllComments`);
  }

  getAllActiveComments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllActiveComments`);
  }

  getAllMappedCommentsById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllMappedCommentsById/${id}`);
  }

  createComments(configdata: any): Promise<any> {
    return lastValueFrom(this.http.post<any>(`${this.apiUrl}/master/createComments`, configdata));
  }

  updateComments(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateComments/${id}`, configdata);
  }

  deleteComments(id: string): Promise<any> {
    return lastValueFrom(this.http.delete<any>(`${this.apiUrl}/master/deleteComments/${id}`));
  }
  //#endregion

  checkProductMappedId(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/checkProductMappedId/${id}`);
  }

  //#region Activity Master
  getAllActivities(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllActivities`);
  }
  getAllActivitiesBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllActivitiesBactive`);
  }
  getActivityById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getActivityById/${id}`);
  }
  createActivity(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createActivity`, configdata);
  }
  updateActivity(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateActivity/${id}`, configdata);
  }
  deleteActivity(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteActivity/${id}`);
  }

  createLeadsActivities(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createLeadsActivities`, configdata);
  }
  updateCommentInActivity(id: any, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/master/updateCommentInActivity/${id}`, payload);
  }
  updateCommentInActivityWithId(activityId: string, commentId: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/master/updateCommentInActivityWithId/${activityId}/${commentId}`, payload);
  }
  updateActivityData(activityId: string, updateData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/master/updateActivityData/${activityId}`, updateData);
  }
  getActivitiesByOpportunityId(id: any): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getActivitiesByOpportunityId/${id}`);
  }
  //#endregion

  //#region Product Type Mapped Master
  getAllProductTypeMappeds(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllProductTypeMappeds`);
  }
  getAllProductTypeMappedsBactive(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getAllProductTypeMappedsBactive`);
  }
  getProductTypeMappedById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/master/getProductTypeMappedById/${id}`);
  }
  createProductTypeMapped(configdata: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/master/createProductTypeMapped`, configdata);
  }
  updateProductTypeMapped(id: string, configdata: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/master/updateProductTypeMapped/${id}`, configdata);
  }
  deleteProductTypeMapped(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/master/deleteProductTypeMapped/${id}`);
  }
  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.ioSocket.on(eventName, (data) => subscriber.next(data));
    });
  }
  emitData(eventName: string, data: any) {
    this.socket.ioSocket.emit(eventName, data);
  }
  //#endregion
}
