import { ChangeDetectorRef, Component, signal, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { Router } from "@angular/router";
import { TransitionChecklistComponent } from "../transition-checklist/transition-checklist.component";
import { KPITransitionComponent } from "../kpi-transition/kpi-transition.component";
import { TollgateChecklistComponent } from "../tollgate-checklist/tollgate-checklist.component";
import { Menu } from "primeng/menu";
import { MenuItem } from "primeng/api";
import { ExcelService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service";
import * as htmlToImage from "html-to-image";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { DatePicker } from "primeng/datepicker";
import { FloatLabel } from "primeng/floatlabel";
import { AbstractControl, FormBuilder, FormGroup, FormsModule, NgModel, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { BBLoaderService, BbStoreService, BBToastService, DateRangePickerComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { firstValueFrom, Subscription } from "rxjs";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import moment from "moment";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { GanttChartComponent } from "../gantt-chart/gantt-chart.component";
import { MessagetransferService } from "projects/customer-management-ui/shared/message/messagetransfer.service";
import { Select } from "primeng/select";
import { TextareaModule } from "primeng/textarea";
import { AgGridDataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component";
import { Dialog } from "primeng/dialog";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { TransitionKtPlannerComponent } from "../transition-kt-planner/transition-kt-planner.component";
import { TransitionModalComponent } from "../initiate-transition/transition-modal/transition-modal.component";
import { ApproveModalComponent } from "../../sharedUI/approve-modal/approve-modal.component";
// import { AgGridDynamicHeightDirective } from "../../sharedUI/directives/ag-grid-header-height/ag-grid-dynamic-height.directive";
import { TooltipModule } from "primeng/tooltip";

@Component({
  selector: "app-transition-tabs",
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TransitionChecklistComponent,
    KPITransitionComponent,
    TollgateChecklistComponent,
    Menu,
    IconFieldModule,
    FloatLabel,
    InputTextModule,
    InputIconModule,
    TooltipModule,
    Select,
    DatePicker,
    FormsModule,
    ReactiveFormsModule,
    TextareaModule,
    CommonModule,
    DateRangePickerComponent, GanttChartComponent, AgGridDataTableComponent, Dialog,
    TransitionKtPlannerComponent,
    ApproveModalComponent,
    // AgGridDynamicHeightDirective
  ],
  templateUrl: "./transition-tabs.component.html",
  styleUrls: ["./transition-tabs.component.scss"],
})
export class TransitionTabsComponent {
  private router = inject(Router);
  private excelService = inject(ExcelService);
  private bbLoader = inject(BBLoaderService);
  private transitionService = inject(TransitionService);
  private bbstore = inject(BbStoreService);
  private bbtoaster = inject(BBToastService);
  private modalService = inject(NgbModal);
  private MessagetransferService = inject(MessagetransferService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoriesService);

  @ViewChild('reasonModel') reasonModel?: NgModel;
  @ViewChild('excelMenu') excelMenu!: Menu;
  @ViewChild('actionMenu') actionMenu!: Menu;
  activeTab = signal("checklist");
  confirmForm!: FormGroup;
  showPhasesTransition: boolean = false;
  finalPayloadTemplate: any;
  reason: any = '';
  cloneConfirmModal: boolean = false;
  excelItems: MenuItem[] = [
    { label: "Export Excel", icon: "bi bi-filetype-exe text-2xl", command: () => this.onExport("EXCEL") },
    { label: "Export CSV", icon: "bi bi-filetype-csv text-2xl", command: () => this.onExport("CSV") },
    { label: "Export PDF", icon: "bi bi-filetype-pdf text-2xl", command: () => this.onExport("PDF") },
  ];
  ActionItems: MenuItem[] = [];
  @ViewChild("unsavedChgmodal") unsavedChgModal: any;
  commentMdl: boolean = false;
  @ViewChild("checklistRef")
  checklistComponent!: TransitionChecklistComponent;
  @ViewChild("kpiRef")
  kpiComponent!: KPITransitionComponent;
  @ViewChild("tollgateRef")
  tollgateComponent!: TollgateChecklistComponent;
  @ViewChild("ktplanner")
  ktplanner!: TransitionKtPlannerComponent;
  transitionPeriod: any;
  plannedGoLiveDate: Date | null = null;
  defaultDateRange: any;
  mapped_phases: any = null;
  mapped_transition_phases: any = [];
  transitionId!: any;
  transition_completed: boolean = false;
  templateData: any = null;
  isGant: boolean = false;
  private exportSubscription!: Subscription;
  searchTerm: string = '';
  actionText: string = '';
  commentsColumnData: any = []
  commentsTableData: any = [];
  isUpdated: boolean = false;
  approveDialogVisible: boolean = false;
  appRej: "approve" | "reject" = "approve";
  transitionName: string = '';
  originalTransitionName: string = '';
  isEditing: boolean = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }
  userId: any;
  isEditEnabled: boolean = false;
  defDateFormat: any;
  defTimeZone: any;
  actionOwnerList: any = [];
  private mapToBsDateFormat(format: string): string {
    // You can expand this mapping as needed
    switch (format.toLowerCase()) {
      case 'mm/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'dd/mm/yyyy':
        return 'DD/MM/YYYY';
      case 'yyyy/mm/dd':
        return 'YYYY/MM/DD';
      default:
        return 'MM/DD/YYYY'; // fallback
    }
  }
  transitionData: any;
  users: any = [];
  employeeList: any = [];
  contacts: any = [];
  async ngOnInit() {
    this.activeTab = signal("checklist");
    this.confirmForm = this.fb.group({
      mappedPhase: [null],
      reason: [''],
      users: [null],
      transitionName: ['']
    });
    await this.loadUsers();
    await this.loadActionOwners();
    this.userId = this.bbstore.getItem("userId");
    this.defTimeZone = this.bbstore.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.mapToBsDateFormat(this.bbstore.getItem("dateFormatkey") || 'mm/dd/yyyy');
    this.transitionId = history.state._id;
    this.transition_completed = history.state.transition_completed;
    this.transitionData = history.state.data;
    this.transitionPeriod = {
      startDate: null,
      endDate: null,
    };

    await this.loadMappedPhasesTemplates();
    this.defaultDateRange = {
      start: new Date(),
      end: new Date(),
    };
    if (this.transitionId) {
      await this.loadTemplatMapping();
    }
    await this.loadContactListAgainstAccount();
    await this.listenForUpdates();
    if (this.templateData?.isHold) {
      this.ActionItems = [
        { label: "Change Template", disabled: history?.state?.data?.isHold, icon: "bi-arrow-repeat max-w[200px] before:text-[15px]", command: () => this.onActionTransition("Change Template") },
        { label: "Reinitiate Transition", disabled: false, icon: "bi bi-arrow-clockwise max-w[200px] before:text-[15px]", command: () => this.onActionTransition("Reinitiate") },
        { label: "Cancel Transition", disabled: false, icon: "bi-x-circle max-w[200px] before:text-[15px]", command: () => this.onActionTransition("Cancel") },
        // { label: "Complete Transition", disabled: false, icon: "bi-check-circle before:text-[15px]", command: () => this.onActionTransition("Complete") },
      ];
    } else if (this.templateData?.isCancel) {
      this.ActionItems = [
        { label: "Change Template", disabled: history?.state?.data?.isCancel, icon: "bi-arrow-repeat max-w[200px] before:text-[15px]", command: () => this.onActionTransition("Change Template") },
        { label: "Reinitiate Transition", disabled: false, icon: "bi bi-arrow-clockwise max-w[200px] before:text-[15px]", command: () => this.onActionTransition("Reinitiate") },
        // { label: "Hold Transition", disabled: false, icon: "bi-pause-circle before:text-[15px]", command: () => this.onActionTransition("Hold") },
        // { label: "Complete Transition", disabled: false, icon: "bi-check-circle before:text-[15px]", command: () => this.onActionTransition("Complete") },
      ];
    } else if (this.templateData?.isNew) {
      this.ActionItems = [
        { label: "Edit Action Owner", icon: "bi bi-pencil-square before:text-[15px] max-w[200px]", command: () => this.editAction() },
        { label: "Start Transition", icon: "bi bi-play before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Start") },
        { label: "Change Template", icon: "bi-arrow-repeat before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Change Template") },
        { label: "Cancel Transition", icon: "bi-x-circle before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Cancel") },
      ]
    } else {
      this.ActionItems = [
        { label: "Edit Action Owner", icon: "bi bi-pencil-square before:text-[15px] max-w[200px]", command: () => this.editAction() },
        { label: "Change Template", icon: "bi-arrow-repeat before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Change Template") },
        { label: "Hold Transition", icon: "bi-pause-circle before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Hold") },
        { label: "Cancel Transition", icon: "bi-x-circle before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Cancel") },
        { label: "Complete Transition", icon: "bi-check-circle before:text-[15px] max-w[200px]", command: () => this.onActionTransition("Complete") },
      ]
    }
    this.exportSubscription = this.transitionService.export$.subscribe((exportType) => {
      this.onExport(exportType);
    });

  }

  async loadActionOwners(): Promise<void> {
    try {
      const response = await firstValueFrom(this.transitionService.getAllActionOwners());
      if (response?.success) {
        this.actionOwnerList = response.data;
      }
    } catch (error) {
      console.error('Error loading action owners:', error);
    }
  }

  async loadContactListAgainstAccount(): Promise<void> {
    const contact = await firstValueFrom(this.transitionService.loadContactListAgainstAccount(this.transitionData?.AccountId));
    this.contacts = contact?.data?.map((val: any) => {
      return {
        _id: val._id,
        loginName: `${val.cDisplayName} - ${val.cEmail}`,
        email: val.cEmail,
        empName: val.cDisplayName
      }
    }) || [];
  }

  async editAction() {
    const listItems = this.templateData?.actionOwner?.map((val: any) => {

      const actionName = this.actionOwnerList?.find(
        (o: any) => o._id === val.actionOwnerId
      )?.cActionOwner || '';

      const matchedUsers = this.employeeList?.filter(
        (u: any) => val.users?.includes(u._id)
      ) || [];

      const matchedContacts = this.contacts?.filter(
        (u: any) => val.users?.includes(u._id)
      ) || [];

      // Merge both arrays
      const allUsers = [...matchedUsers, ...matchedContacts];

      return {
        'Action Owner': actionName,
        'User List': allUsers
          .map((user: any) => `${user.empName} - ${user.email}`)
          .join(', '),
        'actionOwnerId': val.actionOwnerId,
        'userId': allUsers.map((user: any) => user._id),
        'users': allUsers
      };
    });
    const modalRef = this.modalService.open(TransitionModalComponent, {
      size: "xl",
      animation: false,
      windowClass: "modal-xl",
    });
    modalRef.componentInstance.showTransitionModal = true;
    modalRef.componentInstance.actionOwnerVisible = true;
    modalRef.componentInstance.isFromChecklist = true;
    modalRef.componentInstance.listItems = listItems;
    modalRef.componentInstance.transitionID = this.templateData?._id;
    modalRef.componentInstance.accountId = this.templateData?.cCompany_Id;

    modalRef.componentInstance.closeModalEvent.subscribe(async (data: any) => {
      if (data?.isUpdated) {
        await this.loadActionOwners();
        await this.loadTemplatMapping();
        this.isUpdated = true;
      }
    })
  }

  async loadUsers(): Promise<void> {
    try {
      this.users = await this.categoryService.getUsers();
      // Sort alphabetically by name
      this.users.sort((a: { loginName: string }, b: { loginName: string }) =>
        a.loginName.localeCompare(b.loginName)
      );

      this.employeeList = await firstValueFrom(this.transitionService.getEmpUserNames());
    } catch { }
  }
  async loadMappedPhasesTemplates() {
    try {
      const mappedPhaseTemplate = await firstValueFrom(this.transitionService.getAllPhasesTemplatesBActiveMasterMapped());
      if (mappedPhaseTemplate.success) {
        this.mapped_transition_phases = mappedPhaseTemplate.data?.filter((val: any) => val._id !== this.transitionData?.mappedProcessId);
      } else {
        this.mapped_transition_phases = [];
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }
  ngOnDestroy() {
    if (this.exportSubscription) {
      this.exportSubscription.unsubscribe();
    }
  }
  cancelModel(dismiss: any) {
    this.confirmForm.reset();
    dismiss();
  }

  unsavedmodal(template: any) {
    this.modalService.open(template, { centered: true, size: 'lg', windowClass: 'custom-modal', backdrop: "static", keyboard: false });
  }

  async confirmNavigate(dismiss: any) {
    try {
      if (this.confirmForm.invalid) {
        this.confirmForm.markAllAsTouched();
        this.bbtoaster.show_warn('Please enter required fields')
        return;
      }
      this.bbLoader.showLoader();
      const payload = {
        id: this.transitionId,
        action:
          this.actionText === 'Change Template' ? 1 : this.actionText === 'Hold' ? 2 : this.actionText === 'Cancel' ? 3 : this.actionText === 'Complete' ? 4 : this.actionText === 'Reinitiate' ? 5 : this.actionText === 'Clone' ? 7 : 6,
        mapped_phases: this.confirmForm.value.mappedPhase,
        reason: this.confirmForm.value.reason,
        users: this.confirmForm.value.users,
        AccountId: this.transitionData?.AccountId
      };

      const response = await firstValueFrom(this.transitionService.actionTransitionProcess(payload));
      if (response.success) {
        this.bbtoaster.show_success(response.message);
      } else {
        dismiss();
        return this.bbtoaster.show_warn(response.message);
      }

      if (this.actionText === 'Start') {
        await this.ngOnInit();
        await this.checklistComponent.loadTemplatMapping();

      } else {
        if (response?.data?.isTask) {
          this.router.navigate(["/master/transitiontasks"]);
        } else if (response.data?.isProduct) {
          this.MessagetransferService.manageDocValueFn("csatSurvey");
          this.MessagetransferService.csatSurveyProductFn(this.templateData?.oActivation_Id, this.transitionId);
          this.router.navigate([`/customer/dashboard`], { state: { companyId: this.templateData?.cCompany_Id } });
        } else {
          this.router.navigate(["/transition/dashboard"]);
        }
      }

      dismiss(); // Close the modal

    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.confirmForm.reset();
      this.cdr.detectChanges();
      this.bbLoader.hideLoader();
    }
  }
  async listenForUpdates() {
    this.transitionService.listen('template-updated').subscribe(data => {
      if (this.transitionId === data?._id) {
        this.templateData = { ...this.templateData, ...data };
        if (this.templateData?.phasesTableValues) {
          const startRaw = this.templateData.phasesTableValues.transitionPeriod?.startDate;
          const endRaw = this.templateData.phasesTableValues.transitionPeriod?.endDate;

          const startMoment = moment(startRaw, ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);
          const endMoment = moment(endRaw, ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);

          this.transitionPeriod = {
            startDate: startMoment.isValid() ? startMoment.toDate() : new Date(),
            endDate: endMoment.isValid() ? endMoment.toDate() : new Date(),
          };

          this.defaultDateRange = {
            start: startMoment.isValid() ? startMoment.toDate() : new Date(),
            end: endMoment.isValid() ? endMoment.toDate() : new Date(),
          };

          if (this.templateData.phasesTableValues?.plannedGoLiveDate) {
            const liveDate = moment(
              this.templateData.phasesTableValues.plannedGoLiveDate,
              ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601],
              true
            );
            this.plannedGoLiveDate = liveDate.isValid() ? liveDate.toDate() : null;
          } else {
            this.plannedGoLiveDate = null; // show empty in calendar
          }

        }


        this.commentsTableData = this.templateData?.reason
          ?.slice() // avoid mutating original array
          ?.sort(
            (a: any, b: any) =>
              new Date(a.dCreatedAt).getTime() - new Date(b.dCreatedAt).getTime()
          ) // 🔁 sort ASC (old → new)
          ?.map((val: any, index: number, arr: any[]) => {

            const prev = arr[index - 1];

            const fromStatus =
              prev?.approvalNotes ??
              prev?.statusName ??
              "";

            const toStatus =
              val?.approvalNotes ??
              val?.statusName ??
              "";

            return {
              "Date & Time": val?.dCreatedAt ? moment(val.dCreatedAt)
                .tz(this.defTimeZone)
                .format(`${this.defDateFormat.toUpperCase()} HH:mm`) : null,

              "User Name": val.userName,

              "Action": !val.isStandalone && fromStatus
                ? `${fromStatus} → ${toStatus}`
                : toStatus,

              "Comments": val.cNotes,
            };
          })
          ?.reverse(); // 🔁 final display: latest on top
        this.cdr.detectChanges()
      }
    });
  }

  async loadTemplatMapping() {
    this.bbLoader.showLoader();

    try {
      const temp = await firstValueFrom(this.transitionService.getByIdTemplateMapping(this.transitionId));
      this.templateData = temp?.data;
      this.transitionName = this.templateData?.cTransition_Name;
      if (this.templateData?.phasesTableValues) {
        const startRaw = this.templateData?.phasesTableValues?.transitionPeriod?.startDate;
        const endRaw = this.templateData?.phasesTableValues?.transitionPeriod?.endDate;

        const startMoment = moment(startRaw, ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);
        const endMoment = moment(endRaw, ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601], true);

        this.transitionPeriod = {
          startDate: startMoment.isValid() ? startMoment.toDate() : new Date(),
          endDate: endMoment.isValid() ? endMoment.toDate() : new Date(),
        };

        this.defaultDateRange = {
          start: startMoment.isValid() ? startMoment.toDate() : new Date(),
          end: endMoment.isValid() ? endMoment.toDate() : new Date(),
        };

        if (this.templateData.phasesTableValues?.plannedGoLiveDate) {
          const liveDate = moment(
            this.templateData.phasesTableValues.plannedGoLiveDate,
            ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601],
            true
          );
          this.plannedGoLiveDate = liveDate.isValid() ? liveDate.toDate() : null;
        } else {
          this.plannedGoLiveDate = null; // show empty in calendar
        }


      }
      this.commentsColumnData = [
        { headerName: "Date & Time", field: "Date & Time", sortable: true, filter: false },
        { headerName: "User Name", field: "User Name", sortable: true, filter: false },
        { headerName: "Action", field: "Action", sortable: true, filter: false },
        {
          headerName: "Comments",
          field: "Comments",
          // tooltipValueGetter: (params: any) => params.value,
          cellStyle: {
            whiteSpace: "normal",
            wordBreak: "break-word",
            lineHeight: "1.4",
            maxHeight: "60px",
            overflowY: "auto",
            padding: "6px"
          },
          sortable: true, filter: false
        },
      ];

      this.commentsTableData = this.templateData?.reason
        ?.slice() // avoid mutating original array
        ?.sort(
          (a: any, b: any) =>
            new Date(a.dCreatedAt).getTime() - new Date(b.dCreatedAt).getTime()
        ) // 🔁 sort ASC (old → new)
        ?.map((val: any, index: number, arr: any[]) => {

          const prev = arr[index - 1];

          const fromStatus =
            prev?.approvalNotes ??
            prev?.statusName ??
            "";

          const toStatus =
            val?.approvalNotes ??
            val?.statusName ??
            "";

          return {
            "Date & Time": val?.dCreatedAt ? moment(val.dCreatedAt)
              .tz(this.defTimeZone)
              .format(`${this.defDateFormat.toUpperCase()} HH:mm`) : null,

            "User Name": val.userName,

            "Action": !val.isStandalone && fromStatus
              ? `${fromStatus} → ${toStatus}`
              : toStatus,

            "Comments": val.cNotes,
          };
        })
        ?.reverse(); // 🔁 final display: latest on top

    } catch (error) {
      console.log("error: ", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  setActiveTab(tab: string) {
    this.searchTerm = '';
    this.activeTab.set(tab);
    this.isGant = false;
  }

  isActive(tab: string): boolean {
    return this.activeTab() === tab;
  }

  onBackClick() {
    if (this.templateData?.task_details) {
      this.router.navigate(["/master/transitiontasks"]);
    } else if (this.transitionData?.isCustomerPortal) {
      this.router.navigate(["customer/transition"]);
    } else if (this.transitionData?.isRequestView) {
      this.router.navigate(["/transition/approval-requests"]);
    } else if (this.transitionData?.isApprovalLevel) {
      this.router.navigate(["/transition/approval"]);
    } else {
      // route changed,so code commented
      // this.router.navigate([`/customer/dashboard`], { state: { companyId: this.templateData?.cCompany_Id } });
      this.router.navigate(["transition/dashboard"]);
      // this.MessagetransferService.manageDocValueFn("csatSurvey");
      this.MessagetransferService.csatSurveyProductFn(this.templateData?.oActivation_Id, this.transitionId);
    }
  }
  onChangeTransitionPhase(event: any) {
    this.showPhasesTransition = event;
  }

  async onExport(exportType: string) {
    let componentRef;

    switch (this.activeTab()) {
      case "checklist":
        componentRef = this.checklistComponent;
        break;
      case "kpi":
        componentRef = this.kpiComponent;
        break;
      case "tollgate":
        componentRef = this.tollgateComponent;
        break;
      case "kt-planner":
        componentRef = this.ktplanner;
        break;
      default:
        return;
    }

    const context = await componentRef.getExportContext();

    // Rest of your export logic...
    componentRef.isExporting = true;
    await this.waitForDomUpdate();

    const filename = context.filename;
    let processedData = context.formData;

    // IMAGE row (for all except CSV and Print)
    if (exportType !== "CSV" && exportType !== "PRINT" && context.htmlSection) {
      const element = context.htmlSection.nativeElement;
      const dataUrl = await htmlToImage.toPng(element, { quality: 1, pixelRatio: 2 });

      if (dataUrl) {
        const headers = Object.keys(processedData[0]);
        const imageRow: { [key: string]: string } = {};
        headers.forEach((header, index) => {
          imageRow[header] = index === 0 ? dataUrl : "";
        });

        if (exportType === "EXCEL") {
          (imageRow as any).isHeaderImage = true;
        } else {
          (imageRow as any).isImageRow = true;
        }

        processedData.unshift(imageRow);
      }
    }

    // for CSV vs Others
    if (exportType === "CSV") {
      this.excelService.exportToCsv(processedData, filename);
    } else {
      // For EXCEL, PDF, PRINT → remove the company/product row if found
      if (processedData.length > 1) {
        const secondRow = Object.values(processedData[1]).join(" ");
        if (
          secondRow.toLowerCase().includes("company name") ||
          secondRow.toLowerCase().includes("product name") ||
          secondRow.toLowerCase().includes("task name")
        ) {
          processedData.splice(1, 1); // remove 2nd row
        }
      }

      if (exportType === "EXCEL") {
        this.excelService.ExportTOExcelWithImage(processedData, filename);
      } else if (exportType === "PDF") {
        this.excelService.exportToPdf(processedData, filename);
      } else if (exportType === "PRINT") {
        this.excelService.printTable(processedData, filename);
      }
    }

    componentRef.isExporting = false;
    await this.waitForDomUpdate();
  }

  waitForDomUpdate() {
    return new Promise((resolve) => setTimeout(resolve, 10));
  }

  async onDateChange(event: any) {

    /* -------------------- CLEAR CASE -------------------- */
    if (event?.getdate === 'clear') {
      const today = moment().startOf('day');

      event = {
        startDate: today.toDate(),
        endDate: today.toDate()
      };
    }

    /* -------------------- VALIDATION -------------------- */
    if (!event || !event.startDate || !event.endDate) {
      return;
    }

    const startMoment = moment(event.startDate);
    const endMoment = moment(event.endDate);

    /* -------------------- DB COMPARISON -------------------- */
    const defaultStart = this.defaultDateRange?.start
      ? moment(this.defaultDateRange.start)
      : null;

    const defaultEnd = this.defaultDateRange?.end
      ? moment(this.defaultDateRange.end)
      : null;

    // Prevent saving if same as DB
    if (
      defaultStart &&
      defaultEnd &&
      startMoment.isSame(defaultStart, 'day') &&
      endMoment.isSame(defaultEnd, 'day')
    ) {
      console.log("No change in dates, not saving");
      return;
    }

    /* -------------------- UPDATE STATE -------------------- */
    this.transitionPeriod = {
      startDate: startMoment.toDate(),
      endDate: endMoment.toDate()
    };

    const payload = {
      type: "phases_table",
      id: this.transitionId,
      updatedData: {
        ...this.templateData?.phasesTableValues,
        transitionPeriod: this.transitionPeriod,
      },
      userId: this.userId
    };

    /* -------------------- API CALL -------------------- */
    try {
      this.transitionService.emitData("updateTransitionTemplate", payload);
    } catch (error) {
      console.error("Error updating template: ", error);
    }
  }



  async onGoLiveDateChange(event: Date | null) {

    /* ---------------- CLEAR CASE ---------------- */
    if (!event) {
      this.plannedGoLiveDate = null;

      const payload = {
        type: "phases_table",
        id: this.transitionId,
        updatedData: {
          ...this.templateData?.phasesTableValues,
          plannedGoLiveDate: null,
        },
        userId: this.userId
      };

      try {
        this.transitionService.emitData("updateTransitionTemplate", payload);
      } catch (error) {
        console.error("Error updating template: ", error);
      }
      return;
    }

    /* ---------------- DATE SELECT CASE ---------------- */
    const date = new Date(event);
    date.setHours(12, 0, 0, 0); // normalize time

    this.plannedGoLiveDate = new Date(date);

    const payload = {
      type: "phases_table",
      id: this.transitionId,
      updatedData: {
        ...this.templateData?.phasesTableValues,
        plannedGoLiveDate: this.plannedGoLiveDate,
      },
      userId: this.userId
    };

    try {
      this.transitionService.emitData("updateTransitionTemplate", payload);
    } catch (error) {
      console.error("Error updating template: ", error);
    }
  }


  async updateTemplate(payload: any) {
    // console.log("payload: ", payload);
    this.finalPayloadTemplate = payload;
  }

  async onSubmitTemplate() {
    this.bbLoader.showLoader();
    this.finalPayloadTemplate["transitionPeriod"] = this.transitionPeriod;
    this.finalPayloadTemplate["plannedGoLiveDate"] = this.plannedGoLiveDate;
    try {
      this.transitionService.emitData("updateTransitionTemplate", this.finalPayloadTemplate)
      if (this.activeTab() === "kpi") {
        this.kpiComponent.loadTemplate();
      } else if (this.activeTab() === "tollgate") {
        this.tollgateComponent.loadTemplate();
      }
    } catch (error) {
      console.log("error: ", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  setGantTrue(val: any) {
    if (val) {
      this.isGant = true;
    } else {
      this.isGant = false;
    }

  }

  onChangeSearch(event: any) {
    this.searchTerm = event.target.value;
  }

  clearSearch() {
    this.searchTerm = '';
  }

  async onActionTransition(action: any) {
    this.actionText = action;

    if (!['Change Template', 'Clone', "Complete"].includes(this.actionText)) {
      const checkEligible = await firstValueFrom(this.transitionService.checkAccountTransitionInitiated(this.transitionData?.AccountId));

      if (checkEligible?.isTransitionInitiated) {
        return this.bbtoaster.show_warn("Transition approvers are not configured for the account. Please configure approvers to proceed.")
      }
    }
    if (this.actionText === 'Start') {
      const reasonControl = this.confirmForm.get('reason');
      reasonControl?.clearValidators();
      reasonControl?.updateValueAndValidity();
    } else if (this.actionText === 'Change Template') {
      this.confirmForm.get('mappedPhase')?.setValidators(Validators.required);
      this.confirmForm.get('reason')?.setValidators([
        Validators.required,
        this.noWhitespaceValidator
      ]);
      this.confirmForm.get('mappedPhase')?.updateValueAndValidity();
      this.confirmForm.get('reason')?.updateValueAndValidity();
    } else if (this.actionText !== "Complete") {
      this.confirmForm.get('reason')?.setValidators([
        Validators.required,
        this.noWhitespaceValidator
      ]);
      this.confirmForm.get('reason')?.updateValueAndValidity();
    }
    if (['Reinitiate', 'Clone'].includes(this.actionText)) {
      this.confirmForm.get('users')?.setValidators([
        Validators.required,
      ]);
      this.confirmForm.get('users')?.updateValueAndValidity();
    }

    if (['Clone'].includes(this.actionText)) {
      this.confirmForm.get('transitionName')?.setValidators([
        Validators.required,
      ]);
      this.confirmForm.get('transitionName')?.updateValueAndValidity();
    }

    this.unsavedmodal(this.unsavedChgModal);
  }
  noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();
    return value.length === 0 ? { whitespace: true } : null;
  }

  onChangeMappedTransition(event: any) {
    this.mapped_phases = event.value;
  }
  onChangeReason(event: any) {
    this.reason = event;
  }
  openTransitionLogs() {
    this.commentMdl = true;
  }
  closeCommentModal() {
    this.commentMdl = false;
  }
  async confirmClone() {
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      this.bbtoaster.show_warn('Please enter required fields')
      return;
    }
    try {
      this.cloneConfirmModal = false;
      const payload = {
        id: this.transitionData?._id,
        users: this.confirmForm.value.users,
        comments: this.confirmForm.value.reason,
        transitionName: this.confirmForm.value.transitionName
      }
      const res: any = await firstValueFrom(this.transitionService.cloneTransitionProcess(payload))
      if (res?.success) {
        this.bbtoaster.show_success(res?.message);
        this.onBackClick();
        this.confirmForm.reset();
      } else {
        this.bbtoaster.show_warn(res?.message)
      }
      this.modalService.dismissAll();
    } catch (error) {
      this.bbtoaster.show_error("Failed to clone transition process")
    }
  }

  async fromDismissMdl(event: any) {
    this.approveDialogVisible = false;
    if (event) {
      this.onBackClick();
    }
  }

  onClickApproveOrReject(event: any, action: any) {
    const value = event?.value;
    console.log(value);
    this.approveDialogVisible = true;
    this.appRej = action;
  }

  onCloneTransition() {
    this.onActionTransition("Clone")
  }

  enableEdit() {
    if (!this.transitionData?.isCustomerPortal && !this.transition_completed) {
      this.originalTransitionName = this.transitionName; // store old value
      this.isEditing = true;
    }
  }

  async saveValue() {
    const error = this.validateName(this.transitionName);

    if (error) {
      this.bbtoaster.show_warn(error);
      return;
    }

    this.transitionName = this.transitionName.trim();
    const res = await firstValueFrom(this.transitionService.checkTransitionName(this.transitionName));
    if (!res.status) {
      this.transitionName = "";
      this.bbtoaster.show_warn(res.message);
      return;
    }
    this.isEditing = false;
  }

  validateName(name: string): string | null {
    if (!name) return 'Name is required';

    const trimmed = name.trim();

    if (trimmed.length < 3) return 'Minimum 3 characters required';
    if (trimmed.length > 75) return 'Maximum 75 characters allowed';

    if (!/^[a-zA-Z0-9 ]+$/.test(trimmed)) {
      return 'Only alphanumeric characters and spaces are allowed';
    }

    if (name !== trimmed) {
      return 'No leading or trailing spaces allowed';
    }

    return null;
  }

  onOutsideClick() {
    if (this.isEditing) {
      this.transitionName = this.originalTransitionName; // revert
      this.isEditing = false;
    }
  }

  trimValue(field: string) {
    const control = this.confirmForm.get(field);
    if (control?.value) {
      control.setValue(control.value.trim());
    }
  }

  async onNameChange(event: any) {
    const value = event.target.value.trim();

    // update trimmed value
    this.confirmForm.get('transitionName')?.setValue(value);

    if (value.length < 3) return;
    const res = await firstValueFrom(this.transitionService.checkTransitionName(this.confirmForm.get('transitionName')?.value));
    if (!res.status) {
      this.confirmForm.get('transitionName')?.setValue(null);
      this.bbtoaster.show_warn(res.message);
      return;
    }
  }
  async onChangeTransitionName(event: Event) {
    const value = (event.target as HTMLInputElement)?.value?.trim();

    // Minimum length check
    if (!value || value.length < 3) {
      this.bbtoaster.show_warn('Minimum 3 characters required');
      return;
    }

    // Maximum length check
    if (value.length > 75) {
      this.bbtoaster.show_warn('Maximum 75 characters allowed');
      return;
    }

    const res = await firstValueFrom(
      this.transitionService.checkTransitionName(value)
    );

    if (!res?.status) {
      this.bbtoaster.show_warn(res?.message || 'Transition name already exists');
      return;
    }

    this.transitionName = value;

    const payload = {
      id: this.transitionId,
      cTransition_Name: this.transitionName,
      userId: this.userId,
      type: "updateName"
    };

    try {
      this.transitionService.emitData("updateTransitionTemplate", payload);
    } catch (error) {
      console.error("Error updating template: ", error);
    }
  }

  actionDisabled() {
    if (this.templateData?.isCancel || this.templateData?.isHold || this.templateData?.isNew || this.transitionData?.isCustomerPortal || this.transition_completed) {
      return true;
    }
    return false;
  }
}
