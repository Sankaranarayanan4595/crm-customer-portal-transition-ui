import { Component, OnInit, inject } from "@angular/core";
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { firstValueFrom } from "rxjs";
import {
  BBToastService,
  DataTableComponent,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { HttpErrorResponse } from "@angular/common/http";
import { PhaseMaster } from "projects/customer-management-ui/shared/interface/masterInterface";
import { NgSelectModule } from '@ng-select/ng-select';

import { CommonModule } from "@angular/common";
import { TransitionService } from "projects/crm-customer-portal-transition-ui/shared/transition/transition.service";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { FloatLabel } from "primeng/floatlabel";
import { SelectModule } from "primeng/select";
import { DialogModule } from "primeng/dialog";
import { CheckboxModule } from "primeng/checkbox";
@Component({
  selector: 'app-crm-transition-phases',
  imports: [ReactiveFormsModule, FormsModule, DataTableComponent, NgSelectModule, CommonModule, ButtonModule, DialogModule, SelectModule, FloatLabel, InputTextModule, CheckboxModule],
  templateUrl: './crm-transition-phases.component.html',
  styleUrl: './crm-transition-phases.component.scss'
})
export class CrmTransitionPhasesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private TransitionService = inject(TransitionService);
  private bbToaster = inject(BBToastService);

  DocTypeForm: FormGroup;
  currentcattID: any;
  listItems: any; isEditMode = false;
  rawData: any;
  phase!: PhaseMaster;

  recive_data(data: any) {
    if (data.type == "delete") {
      this.deleteData(data.data);
    } else if (data.type == "edit") {
      this.editData(data.data);
    }
  }
  table: any;
  action_fields = {
    delete: true,
    edit: true,
    view: false,
    copy: false,
    manager_type: false,
    email: false,
    restrict_view: false,
  };
  position = "last";

  image_colum = {
    show: false,
    header: "Global",
    url: "../../../assets/icons/download.png",
  };

  button_colum = {
    header: "Status",
    backgroud_colour: "red",
  };
  ngOnInit(): void {
    this.loadPhase();
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    this.DocTypeForm = this.fb.group({
      cPhaseDescription: ['', Validators.required],
      cPhaseName: ['', Validators.required],
      bActive: false
    });
  }


  clearForm(): void {
    this.DocTypeForm.reset();
    this.isEditMode = false;
    this.currentcattID = "";
  }
  logFormValidationErrors() {
    Object.keys(this.DocTypeForm.controls).forEach((key) => {
      const controlErrors = this.DocTypeForm.get(key)?.errors;
      if (controlErrors) {
        this.DocTypeForm.get(key)?.markAsTouched();
      }
    });
  }
  onSubmit() {
    this.markAllAsTouched();
    if (this.DocTypeForm.valid) {
      if (this.currentcattID) {
        this.updateActivation();
      } else {
        this.saveActivation();
      }
      this.DocTypeForm.reset();
    } else {
      this.DocTypeForm.markAllAsTouched();
      this.logFormValidationErrors();
      this.bbToaster.show_error(
        "Please enter the required fields"
      );
    }
  }
  markAllAsTouched(): void {
    Object.values(this.DocTypeForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }
  async saveActivation() {
    try {
      const formValues = { ...this.DocTypeForm.value };
      const saveData = await firstValueFrom(
        this.TransitionService.createPhase(formValues)
      );
      if (saveData) {
        this.bbToaster.show_success(
          "Saved successfully."
        );
        this.loadPhase();
        this.DocTypeForm.reset();
      }
    } catch (error) {
      this.handleError(error);
      console.error("Error saving Phases details:", error);
      (error: HttpErrorResponse) => {
        console.error('Error saving Phases details:', error);
        this.bbToaster.show_warn(error.error.message);
      }

    }
  }
  private handleError(error: any) {
    console.error("Error:", error);

    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) {
        const errorMessage = error.error.message || "Bad request";
        this.bbToaster.show_error(errorMessage);
      } else {
        this.bbToaster.show_error("Phase already exists");
      }
    } else {
      this.bbToaster.show_error("An unexpected error occurred");
    }
  }
  async deleteData(index: any) {
    const currentcattID = index["_id"]?._id;
    try {
      const deleteData: any = await firstValueFrom(
        this.TransitionService.deletePhase(currentcattID)
      );
      if (deleteData?.success) {
        this.bbToaster.show_success(
          "Deleted successfully."
        );
      } else {
        this.bbToaster.show_warn(
          deleteData?.message
        );

      }
      this.isEditMode = false; this.DocTypeForm.reset();
      this.loadPhase();
      this.DocTypeForm.reset();
    } catch (error) {
      console.error("Error deleting Phases details:", error);
    }
  }

  async loadPhase() {
    try {
      const phase: PhaseMaster = await firstValueFrom(
        this.TransitionService.getAllPhases()
      );

      this.rawData = phase.data;
      const filteredData = this.rawData.map((item: { [x: string]: any }) => ({
        "Phase Name": item["cPhaseName"],
        "Description": item["cPhaseDescription"],
        "Is Active": item["bActive"] ? 'Yes' : 'No',
        _id: {
          _id: item["_id"],
        }
      }));
      this.table = filteredData;
      this.listItems = this.table;
    } catch (error) {
      console.error("Error fetching Phases details:", error);
    }
  }
  editData(data: any): void {
    this.isEditMode = true;
    this.DocTypeForm.patchValue({
      cPhaseDescription: data["Description"],
      bActive: data["Is Active"] === 'Yes' ? true : false,
      cPhaseName: data["Phase Name"]
    });
    this.currentcattID = data["_id"]._id;
  }

  async updateActivation() {
    try {
      const editData = {
        cPhaseDescription: this.DocTypeForm.value.cPhaseDescription,
        bActive: this.DocTypeForm.value.bActive,
        cPhaseName: this.DocTypeForm.value.cPhaseName,
      };
      const updateData: any = await firstValueFrom(
        this.TransitionService.updatePhase(this.currentcattID, editData)
      );
      if (updateData?.success) {
        this.bbToaster.show_success(
          "Updated successfully."
        );
      } else {
        this.bbToaster.show_warn(
          updateData?.message
        );
      }
      this.loadPhase();
      this.DocTypeForm.reset();
      this.isEditMode = false;
      this.currentcattID = "";
    } catch (error) {
      this.handleError(error);
      console.error("Error Updating Phase:", error);
      (error: HttpErrorResponse) => {
        console.error('Error Updating Phase:', error);
        this.bbToaster.show_warn(error.error.message);
      }
    }
  }
}
