import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ManageDocumentsService {

  constructor() { }

  documentListPg: boolean = true;
  ShowManageAccountPg: boolean = true;

  defaultTrue(){
    this.documentListPg = true;
    this.ShowManageAccountPg = true;
  }

  toggleViews() {
    this.documentListPg = true;
    this.ShowManageAccountPg = false;
  }
}
