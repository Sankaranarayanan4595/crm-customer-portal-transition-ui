import { Injectable, inject } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { CrmSocketService } from "../crm-socket/crm-socket.service";

@Injectable({
  providedIn: "root",
})
export class TransitionService {
  private http = inject(HttpClient);
  private socket = inject(CrmSocketService);

  private apiUrl = environment.CRM_ApiUrl;
  private exportSubject = new Subject<string>();
  export$ = this.exportSubject.asObservable();

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
  }
  // ✅ CREATE Phase
  createPhase(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/createPhases`, data);
  }

  // Optional: other CRUD methods
  getAllPhases(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllPhases`);
  }
  getAllBActivePhases(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllBActivePhases`);
  }

  getPhaseById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getPhaseById/${id}`);
  }

  updatePhase(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/transition/updatePhase/${id}`, data);
  }

  deletePhase(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transition/deletePhase/${id}`);
  }

  // Mapping template
  getByIdTemplateMapping(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getByIdTemplateMapping/${id}`);
  }
  transitionTemplateJSON(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/transitionTemplateJSON`, data);
  }
  updateTransitionTemplate(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/updateTransitionTemplate`, data);
  }

  // Transition comments
  createTransitionComment(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/createTransitionComment`, data);
  }
  updateTransitionComment(data: any, id: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/updateTransitionComment/${id}`, data);
  }
  getByIdTransitionComments(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/getByIdTransitionComments`, data);
  }
  deleteTransitionComment(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transition/deleteTransitionComment/${id}`);
  }

  //common
  getAllTransitionTemplates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllTransitionTemplates`);
  }
  beginTransitionMapWithProduct(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/beginTransitionMapWithProduct`, data);
  }
  updateBeginTransitionMapWithProduct(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/updateBeginTransitionMapWithProduct`, data);
  }
  checkAlreadyBeginTransition(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/checkAlreadyBeginTransition/${id}`);
  }

  savePhasesTemplateMasterMapping(data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/transition/savePhasesTemplateMasterMapping`, data);
  }
  deletePhasesTemplateMasterMapping(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transition/deletePhasesTemplateMasterMapping/${id}`);
  }
  getAllPhasesTemplatesMasterMapped(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllPhasesTemplatesMasterMapped`);
  }
  getAllPhasesTemplatesBActiveMasterMapped(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllPhasesTemplatesBActiveMasterMapped`);
  }
  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.ioSocket.on(eventName, (data) => subscriber.next(data));
    });
  }
  emitData(eventName: string, data: any) {
    this.socket.ioSocket.emit(eventName, data);
  }
  getProductMappedtoTransition(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getProductMappedtoTransition/${id}`);
  }

  //survey
  getAllSurveyTemplates(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllSurveyTemplates`);
  }
  getAllSavedSurveyTemplates(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllSavedSurveyTemplates/${id}`);
  }
  saveSurveyTemplates(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/saveSurveyTemplates`, data);
  }
  sendSurveyMailTemplate(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/sendSurveyMailTemplate`, data);
  }
  deleteSurveyTemplate(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/transition/deleteSurveyTemplate/${id}`);
  }
  getSurveyTemplate(surveyTemplateId: string) {
    return this.http.get(`${this.apiUrl}/survey-templates/${surveyTemplateId}`);
  }
  getValueMappedSurveybyId(id: string, templateId: string): Observable<any> {
    const headers = { "shared-link": "true" };
    return this.http.get(`${this.apiUrl}/transition/getValueMappedSurveybyId/${id}/${templateId}`, { headers });
  }
  submitSurveyResponse(data: any): Observable<any> {
    const headers = { "shared-link": "true" };
    return this.http.post(`${this.apiUrl}/transition/submitSurveyResponse`, data, { headers });
  }
  triggerExport(exportType: string) {
    this.exportSubject.next(exportType);
  }

  //Transition Tasks
  createTransitionTask(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/createTransitionTask`, data);
  }
  getAllTransitionTasks(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllTransitionTasks`);
  }
  checkTransitionComplete(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/checkTransitionComplete/${id}`);
  }
  actionTransitionProcess(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/actionTransitionProcess`, payload);
  }
  getCSATScoreById(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getCSATScoreById/${id}`);
  }
  loadOpportunityForTransition() {
    return this.http.get(`${this.apiUrl}/transition/loadOpportunityForTransition`);
  }
  loadExistingTransition() {
    return this.http.get(`${this.apiUrl}/transition/loadExistingTransition`);
  }
  getTransitionByOpportunityId(opportunityId: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getTransitionByOpportunityId/${opportunityId}`);
  }
  loadApprovalTransitionRequest() {
    return this.http.get(`${this.apiUrl}/transition/loadApprovalTransitionRequest`);
  }
  loadExitingApprovalTransitionRequest() {
    return this.http.get(`${this.apiUrl}/transition/loadExitingApprovalTransitionRequest`);
  }
  getEmpUserNames() {
    return this.http.get(`${this.apiUrl}/transition/getEmpUserNames`);
  }
  resendSurvey(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/resend-survey`, data);
  }
  createActionOwner(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/createActionOwner`, data);
  }
  getAllActionOwners(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getAllActionOwners`);
  }
  updateActionOwner(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/transition/updateActionOwner/${id}`, data);
  }
  deleteActionOwner(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/deleteActionOwner`, data);
  }
  approveOrRejectTransition(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/approveOrRejectTransition`, data);
  }
  checkAccountTransitionInitiated(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/checkAccountTransitionInitiated/${id}`);
  }
  getTransitonApprovalAccountList(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/getTransitonApprovalAccountList`);
  }
  checkAccountTransitionIsApprovalLevel(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/checkAccountTransitionIsApprovalLevel/${id}`);
  }
  cloneTransitionProcess(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transition/cloneTransitionProcess`, payload);
  }
  opportunityListByTransition(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/opportunityListByTransition`);
  }
  loadContactListAgainstAccount(id: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/loadContactListAgainstAccount/${id}`);
  }
  checkTransitionName(name: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/transition/checkTransitionName/${name}`);
  }
}
