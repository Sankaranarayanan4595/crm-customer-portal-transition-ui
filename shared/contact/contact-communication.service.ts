import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ContactCommunicationService {
  // Subject to notify when a contact is added
  private contactAddedSource = new Subject<any>();
  contactAdded$ = this.contactAddedSource.asObservable();

  // Subject to notify when contact list needs refresh
  private refreshContactListSource = new Subject<string>();
  refreshContactList$ = this.refreshContactListSource.asObservable();

  // Emit when a new contact is added
  emitContactAdded(contact: any) {
    this.contactAddedSource.next(contact);
  }

  // Emit when contact list needs refresh
  emitRefreshContactList(companyId: any) {
    this.refreshContactListSource.next(companyId);
  }
}
