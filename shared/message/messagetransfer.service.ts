import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MessagetransferService {
  constructor() {}
  private manageDocumentList: any[] = [];
  public docList = new BehaviorSubject<any>(null);
  private previewDataSource = new BehaviorSubject<any>(null);
  previewData$ = this.previewDataSource.asObservable();

  setPreviewData(data: any) {
    this.previewDataSource.next(data);
  }

  docList$ = this.docList.asObservable();
  manageDocValueFn(message: any) {
    if (this.docList.getValue() !== message) {
      this.docList.next(message);
    }
  }

  private csatSurveyProductId = new BehaviorSubject<any>(null);
  csatSurveyProductId$ = this.csatSurveyProductId.asObservable();

  private csatSurveyScoreId = new BehaviorSubject<any>(null);
  csatSurveyScoreId$ = this.csatSurveyScoreId.asObservable();

  private csatSurveyTransitionId = new BehaviorSubject<any>(null);
  csatSurveyTransitionId$ = this.csatSurveyTransitionId.asObservable();

  csatSurveyProductFn(product: any, transitionId: any) {
    if (this.csatSurveyProductId.getValue() !== product) {
      this.csatSurveyProductId.next(product);
    }
    if (this.csatSurveyTransitionId.getValue() !== transitionId) {
      this.csatSurveyTransitionId.next(transitionId);
    }
  }

  csatSurveyScoreFn(message: any) {
    if (this.csatSurveyScoreId.getValue() !== message) {
      this.csatSurveyScoreId.next(message);
    }
  }

  setDocumentListData(data: any[]) {
    this.manageDocumentList = data;
  }
  getDocumentListData(): any[] {
    return this.manageDocumentList;
  }
  clearDocumentListData() {
    this.manageDocumentList = [];
  }
}
