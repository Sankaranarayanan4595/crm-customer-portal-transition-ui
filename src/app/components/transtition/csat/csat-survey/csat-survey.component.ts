import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild, inject } from "@angular/core";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { ButtonModule } from "primeng/button";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MenuItem } from "primeng/api";
import { InputTextModule } from "primeng/inputtext";
import { FloatLabel } from "primeng/floatlabel";
import { Menu } from "primeng/menu";
import { MessagetransferService } from "projects/customer-management-ui/shared/message/messagetransfer.service";
import { Dialog } from "primeng/dialog";
import { SelectModule } from "primeng/select";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import { BBLoaderService, BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { firstValueFrom } from "rxjs";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { FormioModule } from "@formio/angular";
import { ChipModule } from "primeng/chip";
import { TableModule } from "primeng/table";
import { AgGridDataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component";
@Component({
  selector: "app-csat-survey",
  imports: [
    IconFieldModule,
    InputIconModule,
    ButtonModule,
    Menu,
    InputTextModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    Dialog,
    FloatLabel,
    SelectModule,
    InputTextModule,
    FormioModule,
    ChipModule,
    TableModule,
    AgGridDataTableComponent
  ],
  templateUrl: "./csat-survey.component.html",
  styleUrl: "./csat-survey.component.scss",
})
export class CsatSurveyComponent {
  private MessagetransferService = inject(MessagetransferService);
  private fb = inject(FormBuilder);
  private TransitionService = inject(TransitionService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private categoryService = inject(CategoriesService);
  private cdr = inject(ChangeDetectorRef);

  themeClass: any;
  ActId: any = null;
  surveyTemplates: any;
  selectedSurveyTemplate: any;
  savedSurveyTemp: any;
  filteredSurveys: any[] = [];
  users: any;
  formInstance: any;
  surveyToDelete: any = null;
  currentSurvey: any;
  countries: any[] | undefined;
  selectedCountry: string | undefined;
  visible: boolean = false;
  surveyForm: boolean = false;
  previewSurveyForm: boolean = false;
  surveySuccessForm: boolean = false;
  isSurveyDelete: boolean = false;
  searchTerm: string = "";
  @ViewChild("menu") menu!: Menu;
  SelectedEmailId: any;
  emailIds: any[] = [];
  selectedEmailIndex: number | null = null;
  @Input() transitionId!: any;
  @Input() subClassList: any = [];
  @Output() onChangeTaskComponent = new EventEmitter<any>();
  emailModalForm!: FormGroup;
  surveyModalForm!: FormGroup;
  listItemsColumnData: any = [
    {
      headerName: "S.No",
      field: "SNO",
      sortable: true,
    },
    {
      headerName: "Email ID",
      field: "email",
      sortable: true,
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (_params: any) => {
        return `<span class="action-icons">
                  <div class="d-flex align-items-center gap-3 mt-3">
                    <i class="bi bi-pencil fs-5 cursor-pointer text-primary" title="Edit Product" data-action="edit"></i>
                    <i class="bi bi-trash3 fs-5 cursor-pointer text-danger" title="Delete" data-action="delete"></i>
                  </div>
                </span>`;
      },
      onCellClicked: (params: any) => {
        const target = params.event.target as HTMLElement;
        const action = target.dataset["action"];
        if (action) {
          (params.event as MouseEvent).stopPropagation();
          if (action === "edit") {
            this.editEmail(params.data)
          } else if (action === "delete") {
            this.removeEmail(params.data)
          }
        }
      },
      suppressMenu: true,
      sortable: false,
      filter: false,
    },
  ]
  listItems: any = [];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  showMenu(event: any, survey: any) {
    this.currentSurvey = survey;
    this.menu.toggle(event);
  }

  menuList: MenuItem[] = [
    {
      label: "Delete",
      icon: "pi pi-trash",
      command: () => {
        this.deleteSurvey(true, this.currentSurvey);
      },
    },
  ];
  isTask: boolean = false;
  async ngOnInit() {
    this.emailModalForm = this.fb.group({
      contact: [null],
      userName: [null, [Validators.required, Validators.email]],
    });
    this.surveyModalForm = this.fb.group({
      subClass: [null, [Validators.required]],
      surveyTemplate: [null, [Validators.required]],
    });

    if (this.subClassList?.length === 0) {
      this.surveyModalForm.get("subClass")?.setValidators(null);  // Remove validators
      this.surveyModalForm.get("subClass")?.updateValueAndValidity();  // Update validity state
    }

    this.MessagetransferService.csatSurveyProductId$.subscribe((id) => {
      this.ActId = id;
    });

    if (!this.transitionId) {
      this.MessagetransferService.csatSurveyTransitionId$.subscribe((id) => {
        this.transitionId = id;
        // console.log("transitionId from product ", this.transitionId);
      });
    }
    // console.log("transitionId from task ", this.transitionId);
    if (!this.ActId) {
      this.isTask = true;
    }
    await this.loadUsers();
    await this.loadSurveyTemplates();
    await this.LoadAllSavedSurveyTemplates();
  }

  ngOnDestroy(): void {
    // this.MessagetransferService.csatSurveyProductFn(null);
  }

  toProdServices() {
    // if (this.isTask) {
      this.onChangeTaskComponent.emit(false);
    // } else {
    //   this.MessagetransferService.manageDocValueFn("csatSurvey");
    // }
  }

  send(template: any) {
    this.emailModalForm.reset();
    this.emailIds = [];
    this.visible = true;
    this.currentSurvey = template;
  }

  surveyHandler() {
    this.surveyModalForm.reset();
    this.surveyForm = true;
  }

  previewSurvey(template: any) {
    this.selectedSurveyTemplate = {
      components: [template],
      templateId: template.key,
    };
    this.previewSurveyForm = true;
  }

  handleSurveyChange(_updatedData: any) { }

  surveySuccess() {
    this.surveySuccessForm = true;
  }

  deleteSurvey(showDialog: boolean, survey?: any) {
    this.surveyToDelete = survey || this.surveyToDelete;
    this.isSurveyDelete = showDialog;
  }

  async confirmDelete() {
    try {
      this.bbLoader.showLoader();
      const id = this.surveyToDelete?._id;
      const data = await firstValueFrom(this.TransitionService.deleteSurveyTemplate(id));
      if (data?.success) {
        this.bbToaster.show_success("Survey deleted successfully");
        this.LoadAllSavedSurveyTemplates();
      } else {
        this.bbToaster.show_error(data?.message);
      }
    } catch (error) {
      console.error("Error deleting survey template:", error);
      this.bbToaster.show_error("Error deleting template");
    } finally {
      this.bbLoader.hideLoader();
      this.isSurveyDelete = false;
      this.surveyToDelete = null;
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      this.users = await this.categoryService.getUsers();
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  getUserName(userId: string): string {
    return this.users?.find((u: any) => u._id === userId)?.loginName || "Unknown";
  }

  async loadSurveyTemplates() {
    try {
      this.bbLoader.showLoader();
      const surveyTemp = await firstValueFrom(this.TransitionService.getAllSurveyTemplates());
      this.surveyTemplates = surveyTemp.data;
    } catch (error) {
      console.error("Error fetching Survey templates details:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async LoadAllSavedSurveyTemplates() {
    try {
      this.bbLoader.showLoader();
      const transitionId = this.transitionId?.transitionId ? this.transitionId?.transitionId : this.transitionId;
      const savedSurveyTemp = await firstValueFrom(this.TransitionService.getAllSavedSurveyTemplates(transitionId));
      this.savedSurveyTemp = savedSurveyTemp.data;
      this.filteredSurveys = [...this.savedSurveyTemp];
    } catch (error) {
      console.error("Error fetching Survey templates details:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  filterSurveys() {
    if (!this.searchTerm) {
      this.filteredSurveys = [...this.savedSurveyTemp];
      return;
    }
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredSurveys = this.savedSurveyTemp.filter(
      (survey: { cSurveyName: string; cCreatedBy: string; cUpdatedBy: string, subClassDetails: any }) =>
        survey.cSurveyName.toLowerCase().includes(searchTermLower) ||
        this.getUserName(survey.cCreatedBy).toLowerCase().includes(searchTermLower) ||
        this.getUserName(survey.cUpdatedBy).toLowerCase().includes(searchTermLower) || survey.subClassDetails.cSubClassName.toLowerCase().includes(searchTermLower)
    );
  }

  logFormValidationErrors() {
    Object.keys(this.surveyModalForm.controls).forEach((key) => {
      const controlErrors = this.surveyModalForm.get(key)?.errors;
      if (controlErrors) {
        this.surveyModalForm.get(key)?.markAsTouched();
      }
    });
  }

  async saveSurveyTemp() {
    if (!this.surveyModalForm.valid) {
      this.logFormValidationErrors();
      this.bbToaster.show_error("Please enter required fields");
      return;
    }

    const payload = {
      cSurveyName: this.selectedSurveyTemplate.templateName,
      oTemplateId: this.selectedSurveyTemplate._id,
      iSurveyOrder: 1,
      bActive: this.selectedSurveyTemplate.active ?? false,
      publish: this.selectedSurveyTemplate.publish ?? false,
      transitionId: this.transitionId?.transitionId ? this.transitionId?.transitionId : this.transitionId,
      oActivation_Id: this.ActId,
      oTask_Id: this.transitionId?.productId,
      subClassId: this.surveyModalForm?.get("subClass")?.value
    };

    try {
      const data = await firstValueFrom(this.TransitionService.saveSurveyTemplates(payload));
      if (data?.success) {
        this.surveyForm = false;
        this.bbToaster.show_success("Survey created successfully");
        this.selectedSurveyTemplate = {};
        await this.LoadAllSavedSurveyTemplates();
      } else {
        this.bbToaster.show_error("An error occurred while creating the CSAT survey");
      }
    } catch (error) {
      console.error("Error saving survey template:", error);
      this.bbToaster.show_error("An error occurred while creating the CSAT survey");
    }
  }

  cancelSurveyTemp() {
    this.surveyForm = false;
    this.selectedSurveyTemplate = {};
  }

  onFormRendered() { }

  onFormReady(form: any) {
    this.formInstance = form;
    this.formInstance.readOnly = true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addEmail() {
    try {

      this.SelectedEmailId = this.emailModalForm.get("userName")?.value;

      if (!this.SelectedEmailId || !this.isValidEmail(this.SelectedEmailId)) {
        this.bbToaster.show_error("Please enter a valid email address");
        return;
      }

      const emailObj = { email: this.SelectedEmailId.trim(), contact: this.emailModalForm.get("contact")?.value, SNO: this.emailIds.length + 1, _id: { _id: this.emailIds.length + 1 } };

      if (this.selectedEmailIndex !== null) {
        this.emailIds[this.selectedEmailIndex] = emailObj;
        this.selectedEmailIndex = null;
      } else {
        if (this.emailIds.some((item) => item.email.toLowerCase() === emailObj.email.toLowerCase())) {
          this.bbToaster.show_warn("Email already added");
          return;
        }
        this.emailIds.push(emailObj);
      }

      this.SelectedEmailId = "";
      this.emailModalForm.reset();
      this.emailModalForm.get("userName")?.enable();
      this.emailModalForm.get("contact")?.enable();
    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.listItems = this.emailIds?.map((item: any, index: number) => {
        this.listItemsColumnData = [
          {
            headerName: "S.No",
            field: "SNO",
            sortable: true,
          },
          {
            headerName: "Email ID",
            field: "email",
            sortable: true,
          },
          {
            headerName: "Actions",
            field: "actions",
            cellRenderer: (_params: any) => {
              return `<span class="action-icons">
                  <div class="d-flex align-items-center gap-3 mt-3">
                    <i class="bi bi-pencil fs-5 cursor-pointer text-primary" title="Edit Product" data-action="edit"></i>
                    <i class="bi bi-trash3 fs-5 cursor-pointer text-danger" title="Delete" data-action="delete"></i>
                  </div>
                </span>`;
            },
            onCellClicked: (params: any) => {
              const target = params.event.target as HTMLElement;
              const action = target.dataset["action"];
              if (action) {
                (params.event as MouseEvent).stopPropagation();
                if (action === "edit") {
                  this.editEmail(params.data)
                } else if (action === "delete") {
                  this.removeEmail(params.data)
                }
              }
            },
            suppressMenu: true,
            sortable: false,
            filter: false,
          },
        ]
        return {
          ...item,
          SNO: index + 1
        }
      });
      console.log('this.emailIds: ', this.emailIds);
      this.cdr.detectChanges();
    }

  }

  editEmail(emailObj: any) {
    try {
      const index = this.emailIds.findIndex((item) => item.email === emailObj.email);
      if (index !== -1) {
        this.selectedEmailIndex = index;
        this.SelectedEmailId = emailObj.email;
        if (emailObj?.contact) {
          this.emailModalForm?.get("contact")?.setValue(emailObj?.contact);
          this.emailModalForm?.get("userName")?.setValue(emailObj?.email);
          this.emailModalForm.get("userName")?.disable();
        } else {
          this.emailModalForm?.get("contact")?.setValue(emailObj?.contact);
          this.emailModalForm?.get("userName")?.setValue(emailObj?.email);
          this.emailModalForm.get("userName")?.enable();

        }

      }

    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.cdr.detectChanges();
    }
  }

  removeEmail(emailObj: any) {
    try {
      const index = this.emailIds.findIndex((item) => item.email === emailObj.email);
      if (index !== -1) {
        this.emailIds.splice(index, 1);
      }
    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.cdr.detectChanges();
    }
  }

  async sendMail() {
    if (this.emailIds.length === 0) {
      this.bbToaster.show_error("Please add at least one email address");
      return;
    }

    const payload = {
      oUserCompanyId: this.currentSurvey.oUserCompanyId,
      SurveyDetails: [
        {
          oTemplateId: this.currentSurvey.oTemplateId,
          cSurveyName: this.currentSurvey.cSurveyName,
          cSurveyTemplateId: this.currentSurvey._id,
        },
      ],
      recipients_response: this.emailIds.map((emailObj: any) => ({
        email: emailObj.email,
        isSubmitted: false,
        response: null,
        cSurveyTemplateId: this.currentSurvey._id
      })),
      cCreatedBy: this.currentSurvey.cCreatedBy,
      bActive: true,
      isMailsent: true,
      transitionId: this.transitionId?.transitionId,
      subClassId: this.currentSurvey?.subClassId
    };

    try {
      this.bbLoader.showLoader();
      const response = await firstValueFrom(this.TransitionService.sendSurveyMailTemplate(payload));

      if (response?.success) {
        this.bbToaster.show_success("Survey sent successfully");
        this.cancelEmailDialog();
        this.visible = false;
        this.surveySuccessForm = true;
      } else {
        this.bbToaster.show_error(response?.message);
      }
    } catch (error) {
      console.error("Error sending survey emails:", error);
      this.bbToaster.show_error("Error sending survey");
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  cancelEmailDialog() {
    this.emailIds = [];
    this.SelectedEmailId = "";
    this.selectedEmailIndex = null;
    this.visible = false;
    this.emailModalForm.reset();
    this.emailModalForm.get("userName")?.enable();
    this.emailModalForm.get("contact")?.enable();
  }

  onSelectContact(event: any) {
    const user = this.users?.find((val: any) => val._id === event.value);
    this.emailModalForm.get("userName")?.setValue(user?.empId?.email);
    this.emailModalForm.get("userName")?.disable();
  }

  onChangeEmail(event: any) {
    console.log('event: ', event.target.value);
    const text = event.target.value;
    if (text !== "") {
      this.emailModalForm.get("contact")?.disable();
    } else {
      this.emailModalForm.get("contact")?.enable();
    }

  }

  onChangeSurveyTemplate(event: any) {
    console.log('event: ', event);
    const findValue = this.surveyTemplates?.find((item: any) => item?._id === event?.value);
    this.selectedSurveyTemplate = findValue;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.surveyModalForm.get(fieldName);
    return !!field && field.invalid && (field.touched || field.dirty);
  }
}
