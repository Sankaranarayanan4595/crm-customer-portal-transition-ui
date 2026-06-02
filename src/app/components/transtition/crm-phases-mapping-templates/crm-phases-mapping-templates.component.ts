import { Component, OnInit, inject } from "@angular/core";
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import {
  // BbStoreService,
  BBToastService,
  BBLoaderService,
  // DataTableComponent,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
// import { HttpErrorResponse } from "@angular/common/http";
import { PhaseMaster } from "projects/customer-management-ui/shared/interface/masterInterface";
import { NgSelectModule } from "@ng-select/ng-select";

import { CommonModule } from "@angular/common";
import { TransitionService } from "projects/crm-customer-portal-transition-ui/shared/transition/transition.service";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { FloatLabel } from "primeng/floatlabel";
import { SelectModule } from "primeng/select";
import { DialogModule } from "primeng/dialog";
import { CheckboxModule } from "primeng/checkbox";
import { AgGridDataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component";
import { GridOptions } from "ag-grid-community";
// import {PAGE_SIZE_SELECTOR} from "../../../sharedUI/constants/pagination-list.service"
import { PAGE_SIZE_SELECTOR } from "../../sharedUI/constants/pagination-list.service"
import { AgGridDynamicHeightDirective } from "../../sharedUI/directives/ag-grid-header-height/ag-grid-dynamic-height.directive";
import { TransitionDataTableComponent } from "../../common/transition-data-table/transition-data-table.component";
@Component({
  selector: "app-crm-phases-mapping-templates",
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgSelectModule,
    CommonModule,
    ButtonModule,
    DialogModule,
    SelectModule,
    FloatLabel,
    InputTextModule,
    CheckboxModule,
    AgGridDataTableComponent, AgGridDynamicHeightDirective, TransitionDataTableComponent
  ],
  templateUrl: "./crm-phases-mapping-templates.component.html",
  styleUrl: "./crm-phases-mapping-templates.component.scss",
})
export class CrmPhasesMappingTemplatesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private TransitionService = inject(TransitionService);
  // private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private profileService = inject(CategoriesService);

  paginationPageSizeSelector = PAGE_SIZE_SELECTOR;
  transitionManagers: any;
  listItemsMappedPhasesTemplates: any;
  currentcattID: any;
  listItems: any;
  listItemsColumnData: any[] = [];
  listItemsMappedPhasesTemplatesCol: any[] = [];
  isEditMode = false;
  rawData: any;
  phase!: PhaseMaster;
  phasesMappingTemplateForm: FormGroup;
  processForm: FormGroup;
  showModal: any;
  formDataList: any = [];
  table: any;
  phases: any;
  templates: any;
  mappedPhaseTemplateData: any[] = [];
  rawMappedData: any;
  currentMappedID: any;
  isMappedEdited: boolean = false;
  deleteMdl: boolean = false;
  itemToDelete: any = null;

  action_fields = {
    delete: true,
    edit: true,
    view: false,
    copy: false,
    manager_type: false,
    email: false,
    restrict_view: false,
  };
  action_fields_Phases = {
    delete: true,
    edit: true,
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
  public gridOptions: GridOptions = {
    popupParent: document.body,
  };
  viewTemplate: boolean = false;
  async ngOnInit() {
    this.listItemsColumnData = [
      {
        headerName: "Process Name",
        field: "Process Name",
        sortable: true,
        filter: "checkboxSearchFilter",
      },
      {
        headerName: "Description",
        field: "Description",
        sortable: true,
        filter: "checkboxSearchFilter",
      },
      {
        headerName: "Mapped Phases",
        field: "Mapped Phases",
        wrapText: true,
        autoHeight: true,
        filter: "checkboxSearchFilter",
        cellClass: ["whitespace-pre-line", "break-words", "mappedCol"],
        cellRenderer: (params: any) => {
          if (Array.isArray(params.value)) {
            return params.value.join("<br>");
          }
          return params.value;
        },
      },

      {
        headerName: "Active",
        field: "Active",
        sortable: true,
        filter: "checkboxSearchFilter"
      },
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: any) => {
          const container = document.createElement("div");
          container.className = "flex gap-4";

          const editButton = document.createElement("button");
          editButton.innerHTML = '<i class="pi pi-pencil"></i>';
          editButton.title = "Edit Template";
          editButton.addEventListener("click", () => {
            console.log(params, "params");
            this.editData(params.data);
          });

          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = '<i class="pi pi-trash text-danger"></i>';
          deleteButton.title = "Delete Template";
          deleteButton.addEventListener("click", () => {
            this.deleteData(params.data);
          });

          container.appendChild(editButton);
          container.appendChild(deleteButton);
          return container;
        },
      },
    ];
    this.listItemsMappedPhasesTemplatesCol = [
      {
        headerName: "Phase Name",
        field: "Phase Name",
        sortable: true,
        filter: "checkboxSearchFilter",
      },
      {
        headerName: "Template Name",
        field: "Template Name",
        sortable: true,
        filter: "checkboxSearchFilter",
      },
      {
        headerName: "Sort Order",
        field: "Sort Order",
        sortable: true,
        filter: "checkboxSearchFilter",
      },
      {
        headerName: "Actions",
        field: "actions",
        cellRenderer: (params: any) => {
          const container = document.createElement("div");
          container.className = "flex gap-4";

          // const eyeButton = document.createElement("button");
          // eyeButton.innerHTML = '<i class="bi bi-eye"></i>';
          // eyeButton.title = "Edit Template";
          // eyeButton.addEventListener("click", () => {
          //   console.log(params, "params");
          //   this.viewTemplate = true;
          //   this.formDataList = params?.data?._id?.components;
          // });

          const editButton = document.createElement("button");
          editButton.innerHTML = '<i class="pi pi-pencil"></i>';
          editButton.title = "Edit Template";
          editButton.addEventListener("click", () => {
            console.log(params, "params");
            this.editMappedData(params.data);
          });

          const deleteButton = document.createElement("button");
          deleteButton.innerHTML = '<i class="pi pi-trash text-danger"></i>';
          deleteButton.title = "Delete Template";
          deleteButton.addEventListener("click", () => {
            this.deleteMappedData(params.data);
          });

          // container.appendChild(eyeButton);
          container.appendChild(editButton);
          container.appendChild(deleteButton);
          return container;
        },
      },
    ];
    await this.loadUsers();
    await this.loadPhase();
    await this.loadTransitionTemplates();
    await this.loadMappedPhasesTemplates();
  }

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    this.processForm = this.fb.group({
      cGroupName: ["", Validators.required],
      cDescription: ["", Validators.required],
      bActive: [false],
    });
    this.phasesMappingTemplateForm = this.fb.group({
      cPhaseName: [null],
      cTemplateName: [null],
      cSortOrder: [1],
    });
  }

  recive_data(data: any) {
    if (data.type == "delete") {
      this.deleteData(data.data);
    } else if (data.type == "edit") {
      this.editData(data.data);
    }
  }

  // recive_data_Mapped_Phases_Templates(data: any) {
  //   if (data.type == "delete") {
  //     this.deleteMappedData(data.data);
  //   } else if (data.type == "edit") {
  //     this.editMappedData(data.data);
  //   }
  // }

  logFormValidationErrors() {
    Object.keys(this.processForm.controls).forEach((key) => {
      const controlErrors = this.processForm.get(key)?.errors;
      if (controlErrors) {
        this.processForm.get(key)?.markAsTouched();
      }
    });
  }

  markAllAsTouched(): void {
    Object.values(this.processForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  async restrictNegative(event: KeyboardEvent) {
    const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete", "Home", "End"];

    const invalidKeys = ["-", "+", "e", "E", "."];

    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // const input = event.target as HTMLInputElement;
    // const value = input.value;
    // const selectionStart: any = input.selectionStart;
    // const selectionEnd: any = input.selectionEnd;

    if (!/^[\d.]$/.test(event.key)) {
      event.preventDefault();
      return;
    }
  }

  // async deleteData(item: any) {
  //   debugger
  //   console.log(item);
  //   this.deleteMdl=true;
  //   if(this.isDelete){
  //   const currentcattID = item?._id?._id || item?._id;
  //   if (!currentcattID) {
  //     this.bbToaster.show_warn("Invalid ID. Cannot delete item.");
  //     return;
  //   }

  //   // const canProceed = await this.checkMappedTransition(currentcattID);
  //   // if (!canProceed) return;

  //   try {
  //     const deleteResponse: any = await firstValueFrom(
  //       this.TransitionService.deletePhasesTemplateMasterMapping(currentcattID)
  //     );

  //     if (deleteResponse?.success) {
  //       this.bbToaster.show_success("Deleted successfully.");
  //       this.isEditMode = false;
  //       this.phasesMappingTemplateForm.reset();
  //       this.ngOnInit();
  //     } else {
  //       this.bbToaster.show_warn(deleteResponse?.message || "Delete failed.");
  //     }
  //   } catch (error) {
  //     console.error("Error deleting Phases details:", error);
  //     this.bbToaster.show_error("Something went wrong during deletion.");
  //   }
  // }
  // }



  deleteData(item: any) {
    this.itemToDelete = item;
    this.deleteMdl = true;
  }

  async ondelete(confirm: boolean) {
    if (!confirm) {
      this.deleteMdl = false;
      this.itemToDelete = null;
      return;
    }

    const currentcattID = this.itemToDelete?._id?._id || this.itemToDelete?._id;
    if (!currentcattID) {
      this.bbToaster.show_warn("Invalid ID. Cannot delete item.");
      return;
    }

    try {
      const deleteResponse: any = await firstValueFrom(
        this.TransitionService.deletePhasesTemplateMasterMapping(currentcattID)
      );

      if (deleteResponse?.success) {
        this.bbToaster.show_success("Deleted successfully.");
        this.itemToDelete = null;
        this.deleteMdl = false;
        this.ngOnInit();
      } else {
        this.bbToaster.show_warn(deleteResponse?.message || "Delete failed.");
      }

    } catch (error) {
      console.error("Error deleting item:", error);
      this.bbToaster.show_error("Something went wrong during deletion.");
    }
  }

  async loadMappedPhasesTemplates() {
    try {
      this.bbLoader.showLoader();
      const temp = await firstValueFrom(this.TransitionService.getAllPhasesTemplatesMasterMapped());

      if (temp.success) {
        this.rawMappedData = temp.data;

        this.listItems = this.rawMappedData.map((group: any) => {
          const mappedPhases = group.transitionDetails
            .sort((a: any, b: any) => a.iSortOrder - b.iSortOrder)
            .map((detail: any) => {
              const phaseName = this.phases.find((p: { _id: any }) => p._id === detail.oPhaseId)?.cPhaseName || "";
              const templateName =
                this.templates.find((t: { _id: any }) => t._id === detail.oTemplateId)?.templateName || "";
              return `${detail.iSortOrder}. ${phaseName} - ${templateName}`;
            })
            .join("<br>");

          return {
            "Process Name": group.cGroupName,
            Description: group.cDescription || "-",
            "Mapped Phases": mappedPhases,
            Active: group.bActive ? "Yes" : "No",
            _id: { ...group },
          };
        });
      } else {
        this.rawMappedData = [];
        this.listItems = [];
      }
    } catch (error) {
      console.error("Error loading mapped templates:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async loadUsers() {
    try {
      this.bbLoader.showLoader();
      this.transitionManagers = await this.profileService.getUsers();
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async loadPhase() {
    try {
      this.bbLoader.showLoader();
      const phase: PhaseMaster = await firstValueFrom(this.TransitionService.getAllBActivePhases());
      this.phases = phase.data;
    } catch (error) {
      console.error("Error fetching Phases details:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async loadTransitionTemplates() {
    try {
      this.bbLoader.showLoader();
      const temp = await firstValueFrom(this.TransitionService.getAllTransitionTemplates());
      if (temp.success) {
        this.templates = temp.data;
      } else {
        this.templates = [];
      }
    } catch (error) {
      console.log("error: ", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async editData(data: any): Promise<void> {
    console.log(data, "edit");
    const currentcattID = data?._id?._id || data?._id;
    this.currentcattID = currentcattID;
    if (!currentcattID) {
      this.bbToaster.show_warn("Invalid ID. Cannot edit item.");
      return;
    }

    // const canProceed = await this.checkMappedTransition(currentcattID);
    // if (!canProceed) return;

    this.isEditMode = true;
    this.showModal = true;

    this.processForm.patchValue({
      bActive: data._id.bActive,
      cGroupName: data._id.cGroupName,
      cDescription: data._id.cDescription,
    });

    this.mappedPhaseTemplateData = data._id.transitionDetails.map((detail: any) => {
      const phase = this.phases.find((p: any) => p._id === detail.oPhaseId);
      const template = this.templates.find((t: any) => t._id === detail.oTemplateId);

      return {
        phase: {
          _id: phase?._id,
          cPhaseName: phase?.cPhaseName ?? "Unknown",
        },
        template: {
          _id: template?._id,
          cTemplateName: template?.templateName ?? "Unknown",
          ...template
        },
        sortOrder: detail.iSortOrder,
      };
    });

    this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item, _index) => ({
      "Phase Name": item.phase.cPhaseName,
      "Template Name": item.template.cTemplateName,
      "Sort Order": item.sortOrder,
      _id: { ...item.template },
    }));
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.clearMainForm();
  }

  saveMappedPhasesTemplates() {
    try {
      if (this.isMappedEdited === true) {
        this.updateMappedPhasesTemplates();
      } else {
        this.addMappedPhasesTemplates();
      }
    } catch (error) { }
  }

  addMappedPhasesTemplates() {
    try {
      const formValue = this.phasesMappingTemplateForm.value;

      if (!formValue.cPhaseName || !formValue.cTemplateName) {
        this.bbToaster.show_error("Please select both Phase and Template");
        return;
      }

      const selectedPhase = this.phases.find((p: { _id: string }) => p._id === formValue.cPhaseName);
      const selectedTemplate = this.templates.find((t: { _id: string }) => t._id === formValue.cTemplateName);

      if (!selectedPhase || !selectedTemplate) {
        this.bbToaster.show_error("Selected phase or template not found");
        return;
      }

      if (this.mappedPhaseTemplateData.some((item) => item.phase._id === selectedPhase._id)) {
        this.bbToaster.show_warn("This phase is already mapped to a template.");
        return;
      }

      if (
        formValue.cSortOrder !== null &&
        formValue.cSortOrder !== undefined &&
        this.mappedPhaseTemplateData.some((item) => item.sortOrder === formValue.cSortOrder)
      ) {
        this.bbToaster.show_warn("Sort Order already exists. Please use a unique value.");
        return;
      }

      const newEntry = {
        phase: {
          _id: selectedPhase._id,
          cPhaseName: selectedPhase.cPhaseName,
        },
        template: {
          _id: selectedTemplate._id,
          cTemplateName: selectedTemplate.templateName,
        },
        sortOrder: formValue.cSortOrder,
      };

      this.mappedPhaseTemplateData.push(newEntry);

      this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item, index) => ({
        "Phase Name": item.phase.cPhaseName,
        "Template Name": item.template.cTemplateName,
        "Sort Order": item.sortOrder,
        _id: { ...item, index },
      }));

      this.phasesMappingTemplateForm.reset({ cSortOrder: 1 });
    } catch (error) {
      console.error("Error adding phases", error);
    }
  }

  editMappedData(data: any) {
    this.isMappedEdited = true;

    if (!data || typeof data !== "object") {
      console.error("Invalid data provided for editing");
      return;
    }

    const phase = this.phases?.find((p: any) => p.cPhaseName === data["Phase Name"]);
    const template = this.templates?.find((t: any) => t.templateName === data["Template Name"]);

    if (!phase || !template) {
      console.error("Phase or Template not found");
      return;
    }

    this.phasesMappingTemplateForm.patchValue({
      cPhaseName: phase._id,
      cTemplateName: template._id,
      cSortOrder: data["Sort Order"] ?? 0,
    });

    this.currentMappedID = data._id.index;
  }

  updateMappedPhasesTemplates() {
    if (this.currentMappedID !== null) {
      const formValue = this.phasesMappingTemplateForm.value;

      if (!formValue.cPhaseName || !formValue.cTemplateName) {
        this.bbToaster.show_error("Please select both Phase and Template");
        return;
      }

      const selectedPhase = this.phases.find((p: { _id: any }) => p._id === formValue.cPhaseName);
      const selectedTemplate = this.templates.find((t: { _id: any }) => t._id === formValue.cTemplateName);

      if (!selectedPhase || !selectedTemplate) {
        alert("Selected phase or template not found.");
        return;
      }

      if (
        this.mappedPhaseTemplateData.some(
          (item, index) => index !== this.currentMappedID && item.phase._id === selectedPhase._id
        )
      ) {
        this.bbToaster.show_warn("This phase is already mapped to another template.");
        return;
      }

      const duplicateSortOrder = this.mappedPhaseTemplateData.some(
        (item, index) => index !== this.currentMappedID && item.sortOrder === formValue.cSortOrder
      );
      if (duplicateSortOrder || !formValue.cSortOrder) {
        this.bbToaster.show_warn("Sort Order already exists. Please use a unique value.");
        return;
      }

      const updatedEntry = {
        phase: {
          _id: selectedPhase._id,
          cPhaseName: selectedPhase.cPhaseName,
        },
        template: {
          _id: selectedTemplate._id,
          cTemplateName: selectedTemplate.templateName,
        },
        sortOrder: formValue.cSortOrder,
      };

      this.mappedPhaseTemplateData[this.currentMappedID] = updatedEntry;

      this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item, index) => ({
        "Phase Name": item.phase.cPhaseName,
        "Template Name": item.template.cTemplateName,
        "Sort Order": item.sortOrder,
        _id: { index },
      }));

      this.phasesMappingTemplateForm.reset({ cSortOrder: 1 });
      this.isMappedEdited = false;
      this.currentMappedID = null;
    } else {
      console.warn("Form is invalid or no row selected for update");
    }
  }

  deleteMappedData(data: any) {
    const indexToDelete = data._id.index;

    this.mappedPhaseTemplateData.splice(indexToDelete, 1);
    this.bbToaster.show_success("Deleted successfully.");
    this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item, index) => ({
      "Phase Name": item.phase.cPhaseName,
      "Template Name": item.template.cTemplateName,
      "Sort Order": item.sortOrder,
      _id: {
        index,
      },
    }));

    if (this.currentMappedID === indexToDelete) {
      this.phasesMappingTemplateForm.reset({ cSortOrder: 1 });
      this.isMappedEdited = false;
      this.currentMappedID = null;
    }
  }

  async savePhasesTemplateMasterMapping() {
    try {
      if (!this.processForm.valid) {
        this.bbToaster.show_error("Please enter required fields.");
        return;
      }
      if (!this.mappedPhaseTemplateData || this.mappedPhaseTemplateData.length === 0) {
        this.bbToaster.show_error("Please add at least one Phase-Template mapping.");
        return;
      }

      this.bbLoader.showLoader();

      const transitionDetails = this.mappedPhaseTemplateData.map((value: any, index: number) => ({
        iSortOrder: value?.sortOrder ?? index + 1,
        oTemplateId: value?.template?._id,
        cTemplateName: value?.template?.cTemplateName,
        oPhaseId: value?.phase?._id,
        cPhaseName: value?.phase.cPhaseName,
      }));

      const payload = {
        transitionDetails,
        cGroupName: this.processForm.get("cGroupName")?.value?.trim(),
        cDescription: this.processForm.get("cDescription")?.value?.trim(),
        bActive: this.processForm.get("bActive")?.value,
        isEdited: this.isEditMode,
        editedID: this.currentcattID,
      };
      console.log("payload: ", payload);

      const data = await firstValueFrom(this.TransitionService.savePhasesTemplateMasterMapping(payload));

      if (data?.success) {
        this.bbToaster.show_success(
          this.isEditMode ? "Updated Successfully" : "Saved Successfully"
        );

        this.showModal = false;
        this.mappedPhaseTemplateData = [];
        this.listItemsMappedPhasesTemplates = [];
        this.phasesMappingTemplateForm.reset({ cSortOrder: 1 });
        this.processForm.reset();
        this.isEditMode = false;
        this.currentcattID = null;
        this.ngOnInit();
      }
    } catch (error) {
      console.error("Error saving phases-template mapping:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  clearMainForm() {
    this.showModal = false;
    this.mappedPhaseTemplateData = [];
    this.listItemsMappedPhasesTemplates = [];
    this.isEditMode = false;
    this.currentcattID = null;
    this.phasesMappingTemplateForm.reset();
    this.processForm.reset();
  }

  async checkMappedTransition(mappedId: string): Promise<boolean> {
    try {
      this.bbLoader.showLoader();
      const response = await firstValueFrom(this.TransitionService.getProductMappedtoTransition(mappedId));

      if (response?.isMapped) {
        this.bbToaster.show_warn(
          response.message || "This Process is mapped to Transition and cannot be modified"
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking mapping:", error);
      this.bbToaster.show_error("An error occurred while checking mapping.");
      return false;
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  hidemdl() { }
  get fm() {
    return this.processForm.controls;
  }
}