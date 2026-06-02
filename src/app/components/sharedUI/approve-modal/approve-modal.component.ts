import { Component, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, NgModel } from "@angular/forms";
import { InvoicesService } from 'projects/customer-management-ui/shared/invoices/invoices.service';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { BBLoaderService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from "primeng/floatlabel"
import { TextareaModule } from 'primeng/textarea';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TransitionService } from 'projects/crm-customer-portal-transition-ui/shared/transition/transition.service';

@Component({
  selector: 'app-approve-modal',
  imports: [FormsModule, ButtonModule, FloatLabelModule, TextareaModule, CommonModule],
  templateUrl: './approve-modal.component.html',
  styleUrl: './approve-modal.component.scss'
})
export class ApproveModalComponent {
  activeModal = inject(NgbActiveModal);
  private invoiceService = inject(InvoicesService);
  private transitionService = inject(TransitionService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private router = inject(Router);

  @ViewChild('reasonModel') reasonModel?: NgModel;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  @Input() invoiceNumber!: string;
  @Input() companyName!: string;
  @Input() amount!: any;
  @Input() actionType: 'voiding' | 'editing' = 'voiding';
  @Input() appRej: 'approve' | 'reject' = 'approve';
  @Input() data!: any;
  @Output() dismissMdl = new EventEmitter<boolean>(false);
  @Output() createInvoiceRequest = new EventEmitter<any>();
  @Input() type: string = 'invoice';

  @Input() reason: string = '';
  async ngOnInit(): Promise<void> {
    console.log('data: ', this.data);
    this.reason = "";
  }

  dismissMdlFn() {
    // this.activeModal.dismiss();
    this.reason = "";
    if (this.reasonModel) {
      this.reasonModel.reset();
      this.reasonModel.control.markAsPristine();
      this.reasonModel.control.markAsUntouched();
    }

    this.dismissMdl.emit(false);
  }

  async confirmAction() {

    if (!this.reason?.trim() && this.appRej !== 'approve') {
      this.bbToaster.show_warn(
        "Please provide a remark before proceeding."
      );
      return;
    }
    // IF LAST LEVEL → ONLY CALL PARENT FUNCTION


    // OTHERWISE CALL API
    try {
      this.bbLoader?.showLoader();
      if (this.type === 'transition') {
        this.TransitionApproval();
      } else {
        await this.InvoiceApproval();
      }
      console.log('this.data: ', this.data);
    } catch (err: any) {
      this.bbToaster.show_warn(
        err?.error?.message
      );
    } finally {
      this.bbLoader?.hideLoader();
    }
  }


  async InvoiceApproval() {
    try {
      const payload = {
        log_id: this.data?._id?.log_id,
        _id: this.data?._id?._id,
        accountId: this.data?._id?.oCompany_Id,
        oSubClassId: this.data?._id?.oSubClassId ?? this.data?._id?.oSubClass,
        reason: this.reason,
        appRej: this.appRej,
        isLastLevel: this.data?._id?.isLastLevel ?? false,
      };
      //console.log('payload: ', payload);
      const isLastLevel = this.data?._id?.isLastLevel ?? false;
      if (isLastLevel && this.appRej === "approve") {
        // Navigate to parent page with full data
        this.router.navigate(['/invoice/billingline/viewList'], {
          state: { invoiceData: this.data, fromChildModal: true }
        });
        this.dismissMdl.emit(true);
        return; // skip API call  
      }

      const res = await lastValueFrom(
        this.invoiceService.approveOrRejectREInvoiceRequest(payload)
      );

      if (res?.success === true) {
        this.bbToaster.show_success(
          res?.message
        );
        this.dismissMdl.emit(true);
      }
    } catch (error) {
      console.log('error: ', error);

    }
  }
  async TransitionApproval() {
    try {
      this.bbLoader.showLoader();
      const payload = {
        id: this.data?._id,
        appRej: this.appRej,
        reason: this.reason,
        approvalRequest: this.data?.transition_logs[0]?.actionRequest?.statusId,
        isLastLevelApproval: this.data?.transition_logs[0]?.currentLevel[this.data?.transition_logs[0]?.currentLevel?.length - 1]?.isCurrentLevel
      }
      const res = await firstValueFrom(this.transitionService.approveOrRejectTransition(payload));
      if (res?.success == true) {
        console.log('Success:', res);
        this.bbToaster.show_success(
          res?.message
        );
        // this.activeModal.close(true);
        this.dismissMdl.emit(true);
      } else {
        this.bbToaster.show_success(
          "Something went wrong."
        );
        return;
      }
    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.bbLoader.hideLoader();
    }
  }

  getProductNames(value: any) {
    return value?.map((val: any) => val.productName).join(", ")
  }

}