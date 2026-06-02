import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from "@angular/core";
import { TransitionDataTableComponent } from "../../common/transition-data-table/transition-data-table.component";
// import { FormsService } from "projects/BBForms-ui/src/public-api";
import { TransitionService } from "projects/crm-customer-portal-transition-ui/shared/transition/transition.service";
import { firstValueFrom } from "rxjs";
import { BBLoaderService, BbStoreService, BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { ButtonModule } from "primeng/button";
import { AccordionModule } from "primeng/accordion";
import { FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Knob } from "primeng/knob";
// import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ToastModule } from "primeng/toast";
// import { ExcelService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service";
import { MenuItem } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
import { BadgeModule } from "primeng/badge";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import moment from "moment";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { CustomerPortalService } from "projects/crm-customer-portal-transition-ui/shared/customer-portal/customer-portal.service";
@Component({
  selector: "app-kpi-transition",
  imports: [
    TransitionDataTableComponent,
    ButtonModule,
    AccordionModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    Knob,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    ToastModule,
    TooltipModule,
    BadgeModule
  ],
  templateUrl: "./kpi-transition.component.html",
  styleUrl: "./kpi-transition.component.scss",
})
export class KPITransitionComponent {
  private categoryService = inject(CategoriesService);
  private transitionService = inject(TransitionService);
  private bbLoader = inject(BBLoaderService);
  private bbToaster = inject(BBToastService);
  // private _route = inject(ActivatedRoute);
  // private _excelService = inject(ExcelService);
  private cdr = inject(ChangeDetectorRef);
  private bbStore = inject(BbStoreService);
  private customerPortalService = inject(CustomerPortalService);

  exportdata: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }
  // private _observer!: MutationObserver;
  value3: Date | undefined;
  @Output() exportRequested = new EventEmitter<string>();
  @Output() updateTemplate = new EventEmitter<any>();
  @ViewChild('transitionDataTable') transitionDataTable!: TransitionDataTableComponent;
  @ViewChildren('transitionDataTable') transitionDataTables!: QueryList<TransitionDataTableComponent>;
  @Input() searchTerm = "";
  actionLists: any = [];
  actionOwnerList: any = [];
  users: any = [];
  employeeList: any = [];
  excelItems: MenuItem[] = [
    { label: "Export Excel", icon: "pi pi-file-excel", command: () => this.exportRequested.emit('EXCEL') },
    { label: "Export CSV", icon: "pi pi-file", command: () => this.exportRequested.emit("CSV") },
    { label: "Export PDF", icon: "pi pi-file-pdf", command: () => this.exportRequested.emit("PDF") },
  ];
  formKnob!: FormGroup;
  formData: any;
  templateFormData: any = [];
  originalTemplateFormData: any = [];
  isCustomerActionList: any = [];
  // private _saveTimer: any;
  template: any;
  phases_list: any;
  original_phases_list: any;
  templateId!: string;
  showPhasesTransition: boolean = false;
  phases_table: boolean = false;
  isModified: boolean = false;
  @Input() isUpdated: boolean = false;
  phaseName!: string;
  transitionId!: any;
  templateData: any = null;
  finalUpdatedData: any = {}; // ✅ Ensure it's initialized
  @ViewChild("setFormIoWidth", { static: false }) setFormIoWidth!: ElementRef;
  transitionPeriod: any;
  plannedGoLiveDate: any = null;
  defaultDateRange: any;
  isExporting: boolean = false;
  Math = Math;
  @ViewChild("htmlSection") htmlSection!: ElementRef;
  @ViewChild("filename") filename!: ElementRef;
  defDateFormat: any;
  defTimeZone: any;
  userId: any;
  isCustomerPortal: boolean = false;
  contacts: any = [];

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

  async ngOnInit() {
    this.transitionId = history.state._id;
    this.transitionData = history.state.data;
    this.isCustomerPortal = history.state.data?.isCustomerPortal ?? false;
    await this.loadUsers();
    await this.loadContactListAgainstAccount();
    await this.loadActionOwners();
    this.userId = this.bbStore.getItem("userId");
    this.defTimeZone = this.bbStore.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey") || 'mm/dd/yyyy');

    const today = this.formatDate(new Date());
    this.transitionPeriod = {
      startDate: today,
      endDate: today,
    };
    if (this.transitionId && this.templateData === null) {
      await this.loadTemplatMapping();
    }
    await this.listenForUpdates();
    if (this.isCustomerPortal) {
      await this.checkTransitionCustomerRole();
    }
  }
  async checkTransitionCustomerRole() {

    try {
      const response: any = await firstValueFrom(this.customerPortalService.checkTransitionCustomerRole(this.templateData?._id))
      console.log('response: ', response);
      this.isCustomerActionList = response?.roles?.map((item: any) => item.role)
    } catch (error) {
      console.log('error: ', error);

    }
  }
  async ngOnChanges(changes: SimpleChanges) {
    if (changes["searchTerm"]) {
      await this.onSerchResult();
    }
    if (changes["isUpdated"]?.currentValue) {
      await this.loadTemplatMapping();
    }
  }

  private getSearchableText(comp: any): string {
    if (!comp) return '';

    return [
      comp.html,                       // content
      comp.label,                      // labels
      comp.key,                        // keys
      comp.defaultValue,               // selected/default value
      ...(comp.data?.values?.map((v: any) => v.label) || []) // select options
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }


  async onSerchResult() {
    try {
      const term = this.searchTerm?.trim().toLowerCase();
      if (this.searchTerm === '') {
        this.phases_list = this.original_phases_list;
        this.templateFormData = this.originalTemplateFormData;
      } else {
        this.phases_list = this.original_phases_list.filter((phase: any) =>
          Object.values(phase)
            .join(' ')
            .toLowerCase()
            .includes(term)
        );

        this.templateFormData = this.originalTemplateFormData
          ?.map((section: any) => {
            const rows = section.components[0].rows.filter(
              (row: any[], rowIndex: number) => {
                // ✅ Always keep header row
                if (rowIndex === 0) {
                  return true;
                }

                // 🔍 Match search term in ANY component field
                return row.some((column: any) =>
                  column?.components?.some((comp: any) =>
                    this.getSearchableText(comp).includes(term.toLowerCase())
                  )
                );
              }
            );

            return {
              ...section,
              components: [
                {
                  ...section.components[0],
                  rows,
                  numRows: rows.length
                }
              ]
            };
          })
          // ❌ Remove sections with only header row
          .filter((section: any) => section.components[0].rows.length > 1);
      }

    } catch (error) {
      console.log('error: ', error);

    } finally {
      await this.renderCards(false);
      this.cdr.detectChanges();
    }
  }

  async listenForUpdates() {
    this.transitionService.listen('template-updated').subscribe(async (data) => {
      if (this.transitionId === data?._id) {
        console.log('Received update from another user:', data);
        if (data?.isSettingUpdated) {
          await this.saveChanges();
        }
        this.templateData = { ...this.templateData, ...data };
        if (this.templateData?.roles) {
          this.isCustomerActionList = this.templateData?.roles?.map((item: any) => item.role);
        }
        this.loadTemplate();
      }

    });
  }

  async loadTemplatMapping() {
    this.bbLoader.showLoader();

    try {
      const temp = await firstValueFrom(
        this.transitionService.getByIdTemplateMapping(this.transitionId)
      );
      this.templateData = temp?.data;
      await this.loadTemplate();
    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.bbLoader.hideLoader();
    }
  }

  convertDateToDDMMYYYY(dateString: any): string {
    if (!dateString) return ''; // Handle null/undefined

    const defTimeZone = this.defTimeZone ? this.defTimeZone : 'Asia/Kolkata';
    const defDateFormat = (this.defDateFormat || 'mm/dd/yyyy').toLowerCase();

    const formatMap: { [key: string]: string } = {
      'mm/dd/yyyy': 'MM/DD/YYYY',
      'dd/mm/yyyy': 'DD/MM/YYYY',
      'yyyy/mm/dd': 'YYYY/MM/DD',
    };

    // Default to MM/DD/YYYY if unknown format
    const momentFormat = formatMap[defDateFormat] || 'MM/DD/YYYY';

    const date = moment.tz(dateString, defTimeZone);

    return date.format(`${momentFormat}`);
  }

  async renderCards(isUpdated: boolean) {
    const getMaxDate = (entries: [string, any][], prefix: string): string | null => {
      const filteredDates = entries
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([, value]) => value);

      if (filteredDates.length === 0) return null;

      // Max by lexicographical order (works for ISO strings)
      return filteredDates.reduce((max, curr) => (curr > max ? curr : max));
    };
    const getMinDate = (entries: [string, any][], prefix: string): string | null => {
      const filteredDates = entries
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([, value]) => value);

      if (filteredDates.length === 0) return null;

      // Min by lexicographical order (works for ISO strings)
      return filteredDates.reduce((min, curr) => (curr < min ? curr : min));
    };

    const formatDate = (dateString: string | null): string | null => {
      if (!dateString) return null;
      // Parse to local date string (YYYY-MM-DD)
      const date = new Date(dateString);
      date.setHours(7, 0, 0, 0)
      return moment(date).format(this.defDateFormat);
    };

    const getStatus = (
      score: number | null,
      actualEnd: string | null,
      targetEnd: string | null
    ): string => {
      if (score === 100 && actualEnd && targetEnd) {
        if (actualEnd === targetEnd) return 'COMPLETED ON TIME';
        return new Date(actualEnd) > new Date(targetEnd)
          ? 'COMPLETED WITH DELAY'
          : 'COMPLETED';
      }
      if (score !== null && score > 0) return 'IN PROGRESS';
      if (targetEnd && new Date(targetEnd) < new Date()) return 'OVERDUE';
      return 'PENDING';
    };

    // Build phase list with scores
    this.phases_list = this.templateData?.phase_info?.map((item: any, index: number) => {
      const phaseDetail = this.templateData.transitionDetails?.find(
        (val: any) => val.oPhaseId === item._id
      );
      const milestoneIndex = index + 1;
      let score = 0;
      let result: any = { score, color: '#3A423E', status: "PENDING", score_template: "0%" };
      let status: string = "";
      let maxTargetEndDate: string | null = null;
      let maxTargetStartDate: string | null = null;
      let maxActualStartDate: string | null = null;
      let maxActualEndDate: string | null = null;
      const today = new Date().toISOString().split('T')[0];

      if (phaseDetail?.KpiValues || this.finalUpdatedData[this.templateId]) {
        const entries = isUpdated && phaseDetail?.oTemplateId === this.templateId ? Object.entries(this.finalUpdatedData[this.templateId] || {}) : Object.entries(phaseDetail?.KpiValues || {});
        const validCount = entries.filter(([k, v]) => k.startsWith('kpi_status_') && v !== 'N/A').length;
        const totalScore = entries
          .filter(([k]) => k.startsWith('kpi_score_'))
          .reduce((sum, [, val]: any) => sum + parseInt(val || '0', 10), 0);

        const maxPossible = validCount * 10;

        score = validCount > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

        maxTargetStartDate = formatDate(getMaxDate(entries, `kpi_targetStartDate_`));
        maxTargetEndDate = formatDate(getMaxDate(entries, `kpi_targetEndDate_`));
        maxActualStartDate = formatDate(getMinDate(entries, `kpi_actualStartDate_`));
        maxActualEndDate = formatDate(getMaxDate(entries, `kpi_actualEndDate_`));
        const possibleStatus = entries?.filter(([k, _v]) => k.startsWith('kpi_score_'))?.length > 0 ? score : null;

        status = entries?.some(
          ([k, v]: any) => k.startsWith("kpi_status_") && v?.toUpperCase() === "COMPLETED WITH DELAY")
          ? "COMPLETED WITH DELAY"
          : !maxActualStartDate && !maxTargetEndDate && !maxActualEndDate && maxTargetStartDate && maxTargetStartDate < moment(today).format(this.defDateFormat) ? "OVERDUE" : getStatus(possibleStatus, maxActualEndDate, maxTargetEndDate);

        result = {
          [`kpi_score_status_${milestoneIndex}`]: status === "OVERDUE" ? "-" : `${score}%`,
          score_template: status === "OVERDUE" ? "-" : `${score}%`,
          score: status === "OVERDUE" ? 100 : score,
          color: ["COMPLETED", "COMPLETED ON TIME"].includes(status)
            ? '#00AB55'
            : ["COMPLETED WITH DELAY", "OVERDUE"].includes(status)
              ? '#8C0000'
              : status === "IN PROGRESS"
                ? '#FF6D00'
                : '#3A423E',
          [`kpi_status_${milestoneIndex}`]: status,
          status,
          status_color: ["COMPLETED", "COMPLETED ON TIME"].includes(status)
            ? "status-green"
            : ["COMPLETED WITH DELAY", "OVERDUE"].includes(status)
              ? "status-red"
              : status === "IN PROGRESS"
                ? "status-orange"
                : "status-ash"
        };
      }

      return {
        phaseName: item?.cPhaseName,
        _id: phaseDetail?.oTemplateId,
        ...result,
        iSortOrder: phaseDetail.iSortOrder,
        phase_id: item?._id,
      };
    });
    this.phases_list = this.phases_list?.sort((a: any, b: any) => a.iSortOrder - b.iSortOrder);
    if (this.original_phases_list === undefined) {
      this.original_phases_list = this.phases_list;
    }
    if (isUpdated) {
      this.original_phases_list = this.phases_list;
    }

    console.log('this.phases_list: ', this.phases_list);
  }

  updateScore(phaseName: any) {
    return this.phases_list?.find((item: any) => item.phaseName === phaseName)?.score;
  }

  async loadTemplate() {
    try {

      // console.log('this.templateData: ', this.templateData);
      this.finalUpdatedData = {};
      this.templateFormData = [];

      if (this.templateData?.phasesTableValues) {
        if (this.templateData?.phasesTableValues?.transitionPeriod) {
          this.transitionPeriod = { startDate: this.convertDateToDDMMYYYY(this.templateData.phasesTableValues.transitionPeriod.startDate), endDate: this.convertDateToDDMMYYYY(this.templateData.phasesTableValues.transitionPeriod.endDate) };
          this.defaultDateRange = this.templateData.phasesTableValues.transitionPeriod;
        }

        if (this.templateData.phasesTableValues?.plannedGoLiveDate) {
          // const _liveDate = moment(
          //   this.templateData.phasesTableValues.plannedGoLiveDate,
          //   ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601],
          //   true
          // );
          this.plannedGoLiveDate = this.convertDateToDDMMYYYY(this.templateData.phasesTableValues.plannedGoLiveDate) || null;
        } else {
          this.plannedGoLiveDate = null; // show empty in calendar
        }

      }
      this.phases_table = true;
      await this.renderCards(false);
      // Load & sort transition form data
      const details = this.templateData?.transitionDetails || [];

      const formDataWithSort = await Promise.all(
        details.map(async (item: any) => {
          const findPhase = this.templateData?.phase_info?.find((val: any) => val._id === item.oPhaseId);
          const findtemplate = this.templateData?.template_info?.find((val: any) => val._id === item.oTemplateId);

          const formData = await this.getTransitionFormData(item?.oTemplateId, findtemplate);
          return {
            iSortOrder: item?.iSortOrder,
            formData,
            phaseName: findPhase?.cPhaseName
          };
        })
      );

      this.templateFormData = formDataWithSort
        .filter((entry) => entry.formData != null)
        .sort((a, b) => a.iSortOrder - b.iSortOrder)
        .map((entry) => { return { ...entry.formData, phaseName: entry.phaseName, iSortOrder: entry.iSortOrder, isUpdated: true } });
      console.log('this.templateFormData: ', this.templateFormData);
      this.originalTemplateFormData = this.templateFormData;
    } catch (error) {
      console.error("Error loading template:", error);
    }
  }
  private normalizeDateFormat(fmt: string): string {
    return fmt
      .split(/[^A-Za-z]+/)        // split by separators like / or -
      .map(token => {
        if (token.toLowerCase() === 'mm') return 'MM'; // month always caps
        return token.toLowerCase();                    // everything else lowercase
      })
      .join(fmt.includes('/') ? '/' : '-');           // rejoin with same separator
  }

  async loadActionOwners(): Promise<void> {
    try {
      const response = await firstValueFrom(this.transitionService.getAllActionOwners());
      if (response?.success) {
        this.actionOwnerList = response.data;
      }
    } catch (error) {
      console.error('Error loading action owners:', error);
      this.bbToaster.show_warn('Failed to load action owners');
    }
  }

  async loadUsers(): Promise<void> {
    const usersResult = await this.categoryService.getUsers();
    const users = (Array.isArray(usersResult) ? usersResult : [])?.sort((a: any, b: any) =>
      a.loginName?.localeCompare(b.loginName)
    );

    this.users = users;
    const employee: any = await firstValueFrom(this.transitionService.getEmpUserNames())
    this.employeeList = employee?.map((val: any) => {
      return {
        ...val,
        loginName: `${val.empName} - ${val.email}`
      }
    })
  }

  async loadContactListAgainstAccount(): Promise<void> {
    const contact = await firstValueFrom(this.transitionService.loadContactListAgainstAccount(this.transitionData?.AccountId));
    this.contacts = contact?.data?.map((val: any) => {
      return {
        _id: val._id,
        loginName: val.cEmail
      }
    }) || [];
  }

  async getTransitionFormData(id: any, templateData: any): Promise<any> {

    const tempId = this.templateData?.transitionDetails?.find(
      (val: any) => val?.oTemplateId === id
    );

    if (!tempId) {
      console.warn("Template not found for ID:", id);
      return null;
    }

    this.templateId = id;
    this.finalUpdatedData[id] = tempId.KpiValues ?? {};
    this.phases_table = false;
    this.showPhasesTransition = true;

    let kpiSection: any = templateData?.components?.find((c: any) =>
      c?.key?.startsWith("kpi_")
    );

    /* -------------------------------------------------
       Action owner mapping
    -------------------------------------------------- */

    this.actionLists = this.templateData?.actionOwner?.map((val: any) => {

      const actionowner = this.actionOwnerList?.find(
        (item: any) => item._id === val.actionOwnerId
      )?.cActionOwner;

      const users = this.employeeList?.filter((u: any) =>
        val.users.includes(u._id)
      );
      const contacts = this.contacts?.filter((u: any) => val.users.includes(u._id));

      return {
        label: actionowner,
        value: actionowner,
        data: [...users, ...contacts]
      }

    });
    let ownerdropdownvalue: any = [];

    /* -------------------------------------------------
       Component preparation
    -------------------------------------------------- */

    kpiSection?.rows?.forEach((row: any[]) => {

      row.forEach((column: any) => {

        if (Array.isArray(column?.components)) {

          column.components.forEach((component: any) => {

            if (component.type === 'datetime') {

              component.format = this.normalizeDateFormat(this.defDateFormat);

              if (!component.widget) {
                component.widget = {};
              }

              component.widget.type = 'calendar';
              component.widget.format = this.normalizeDateFormat(this.defDateFormat);

            }

            const key = component?.key;

            if (!key) return;

            const index = key.split("_")[2];

            if (this.templateData?.isActiveTransition && key !== `kpi_commentIconBtn_${index}`) {
              component.disabled = true;
            }

            /* Comment badge */

            if (key === `kpi_commentIconBtn_${index}`) {

              const count =
                this.templateData?.transition_comments?.filter((comment: any) =>
                  comment.key === key &&
                  comment.type === "kpiTransition" &&
                  comment?.oTemplateId === id
                )?.length ?? 0;

              component.leftIcon = "bi bi-chat-left-dots";
              if (count !== 0) {
                component.label = `<span class='badge-count'>${count}</span>`;
              } else {
                component.label = null;
              }
            }

            /* Owner */

            if (key.startsWith('kpi_owner_')) {

              component.data = {
                ...component.data,
                values: this.actionLists
              }
              if (this.finalUpdatedData[id][key]?.length > 0) {
                const loginNameUsers =
                  this.actionLists
                    ?.filter((item: any) => this.finalUpdatedData[id][key]?.includes(item.label))
                    ?.flatMap((item: any) => item.data || [])
                    ?.map((user: any) => user.loginName) || [];
                // Form.io dropdown format
                const dropdownValues = loginNameUsers.map((name: string) => ({
                  label: name,
                  value: name
                }));
                ownerdropdownvalue = dropdownValues
              } else {
                ownerdropdownvalue = [];
              }

            }

            /* Stakeholder */

            if (key.startsWith('kpi_stakeholder_')) {

              component.data = {
                ...component.data,
                values: ownerdropdownvalue
              }

            }

            /* Default values */

            if (this.finalUpdatedData[id].hasOwnProperty(key)) {

              if (key.startsWith("kpi_score_")) {

                component.label = this.finalUpdatedData[id][key];
                component.html = this.finalUpdatedData[id][key];

              } else {

                component.defaultValue = this.finalUpdatedData[id][key];

              }

            } else if (component.defaultValue != null) {

              this.finalUpdatedData[id][key] = component.defaultValue;

            }

          });

        }

      });

    });

    /* =================================================
       CUSTOMER PORTAL TRANSFORMATION
    ================================================= */

    if (this.isCustomerPortal) {
      const originalTable = kpiSection;

      if (Array.isArray(originalTable?.rows)) {

        // 🔥 Deep copy rows (NO mutation)
        let newRows = originalTable.rows.map((row: any[]) =>
          row.map((column: any) => ({
            ...column,
            components: Array.isArray(column?.components)
              ? column.components.map((comp: any) => ({ ...comp }))
              : []
          }))
        );

        /* -------------------------------------------------
           STEP 1: Remove "Client/Internal" ONLY in FIRST ROW
        -------------------------------------------------- */
        if (newRows[0]) {
          newRows[0] = newRows[0].map((column: any) => ({
            ...column,
            components: column.components.filter(
              (component: any) => component?.key !== "Client Access"
            )
          }));
        }

        /* -------------------------------------------------
           STEP 2: Filter rows
        -------------------------------------------------- */
        newRows = newRows.filter((row: any[], rowIndex: number) => {

          if (rowIndex === 0) return true;

          return row.some((column: any) =>
            column.components.some((component: any) =>
              component?.customClass?.startsWith("milestone-header-cell") ||
              (
                component?.key?.startsWith("kpi_portal_action_") &&
                ["client_view_only", "client_view_edit_SME", 'client_view_edit_TM'].includes(component?.defaultValue)
              )
            )
          );
        });

        /* -------------------------------------------------
           STEP 3: Enable / Disable entire row properly
        -------------------------------------------------- */
        newRows.forEach((row: any[]) => {

          // 🔥 Detect row permission FIRST
          const rowPermission = row
            .flatMap((col: any) => col.components)
            .find((comp: any) => comp?.key?.startsWith("kpi_portal_action_"))
            ?.defaultValue;
          console.log('rowPermission: ', rowPermission);

          const allowedEditPermissions = this.isCustomerActionList?.length > 0
            ? this.isCustomerActionList
            : ["client_view_edit_SME", "client_view_edit_TM"];

          const isEditRow = allowedEditPermissions.includes(rowPermission);
          const isViewOnlyRow = rowPermission === "client_view_only";

          row.forEach((column: any) => {
            column.components.forEach((component: any) => {
              const key = component?.key;
              if (!key) return;

              if (isEditRow) {
                component.disabled = this.transitionData?.transition_completed ? true : false; // Enable all fields in the row
                // ✅ Apply to the component so Form.io actually renders it into the DOM.
                // This is just a marker for your setTimeout script.
                const existingClasses = component.customClass || "";
                if (!existingClasses.includes("customerEditableRow") && !this.transitionData?.transition_completed) {
                  component.customClass = `${existingClasses} customerEditableRow`.trim();
                }
              } else if (isViewOnlyRow) {
                const isCommentBtn = key.startsWith("kpi_commentIconBtn_");
                component.disabled = !isCommentBtn;
              } else {
                component.disabled = true; // ✅ FIXED
              }
            });
          });
        });

        /* -------------------------------------------------
           STEP 4: Remove portal_action_* components
           Remove empty columns & rows
        -------------------------------------------------- */
        newRows = newRows
          .map((row: any[]) =>
            row
              .map((column: any) => ({
                ...column,
                components: column.components.filter(
                  (component: any) =>
                    !component?.key?.startsWith("kpi_portal_action_")
                )
              }))
              .filter((column: any) => column.components.length > 0)
          )
          .filter((row: any[]) => row.length > 0);

        /* -------------------------------------------------
          STEP 5: Remove milestone rows with no children
          -------------------------------------------------- */

        const milestoneChildren: any = {};

        // Detect children referencing milestones
        newRows.forEach((row: any[]) => {
          row.forEach((column: any) => {
            column.components.forEach((comp: any) => {

              const key = comp?.key;

              if (key?.includes(" M")) {
                const milestone = key.split(" ").pop(); // M1, M2
                milestoneChildren[milestone] = true;
              }

            });
          });
        });

        // Remove milestone rows with no children
        newRows = newRows.filter((row: any[]) => {

          const milestoneComp = row
            .flatMap((c: any) => c.components)
            .find((c: any) => c?.key?.startsWith("ID_M"));

          if (!milestoneComp) return true;

          const milestone = milestoneComp.key.replace("ID_", "");

          return milestoneChildren[milestone];
        });


        /* -------------------------------------------------
           STEP 6: Renumber milestone LABELS only
        -------------------------------------------------- */

        let milestoneIndex = 1;

        newRows.forEach((row: any[]) => {

          row.forEach((column: any) => {

            column.components.forEach((comp: any) => {

              if (comp?.key?.startsWith("ID_M")) {

                comp.label = `M${milestoneIndex}`;
                comp.html = `M${milestoneIndex}`;
                milestoneIndex++;

              }

            });

          });

        });

        /* -------------------------------------------------
          STEP 7: Update child labels (a,b,c...) per milestone
        -------------------------------------------------- */

        const alphabet = "abcdefghijklmnopqrstuvwxyz";

        const milestoneChildIndex: any = {};

        newRows.forEach((row: any[]) => {

          row.forEach((column: any) => {

            column.components.forEach((comp: any) => {

              const key = comp?.key;

              if (!key) return;

              // Detect child rows like ID_2 M4
              if (key.startsWith("ID_") && key.includes(" M") && !key.startsWith("ID_M")) {

                const milestone = key.split(" ").pop(); // M4

                if (!milestoneChildIndex[milestone]) {
                  milestoneChildIndex[milestone] = 0;
                }

                const index = milestoneChildIndex[milestone];

                const label = alphabet[index] || `a${index}`;

                comp.label = label;
                comp.html = label;

                milestoneChildIndex[milestone]++;

              }

            });

          });

        });

        /* -------------------------------------------------
           STEP 8: Create NEW table (no mutation)
        -------------------------------------------------- */

        /* -------------------------------------------------
           STEP 6: Build new table
        -------------------------------------------------- */

        const newTableComponent = {
          ...originalTable,
          rows: newRows,
          numRows: newRows.length,
          numCols: newRows[0]?.length || 0
        };

        kpiSection = {
          ...newTableComponent
        };
      }
    }

    /* -------------------------------------------------
       Final output
    -------------------------------------------------- */

    const score_data = this.phases_list?.find((item: any) => item._id === id)

    const formOutput = {
      ...templateData,
      components: [kpiSection],
      templateId: id,
      type: "kpiTransition",
      score: score_data?.score ?? 0,
      transitionId: this.templateData?._id
    };

    return formOutput;

  }

  backToChecklist() {
    this.showPhasesTransition = false;
    this.phases_table = true;
    // this.loadTemplate();
  }

  onDateChange(event: any) {
    console.log("event: ", event);
    this.transitionPeriod = event;
  }

  formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  async onSubmit() {
    const payload = {
      id: this.transitionId,
      type: "kpiTransition",
      templateId: this.templateId,
      updatedData: this.finalUpdatedData,
    };
    this.updateTemplate.emit(payload)
  }
  clearInputByName(fieldName: string) {
    const input = document.querySelector(`input[name="data[${fieldName}]"]`) as HTMLInputElement;
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }
  private getTableInstance(templateId: any): TransitionDataTableComponent | undefined {
    return this.transitionDataTables.find(comp => comp.formData.templateId === templateId);
  }
  private isWeekend(dateValue: any): boolean {
    const date = new Date(dateValue);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  }
  async onChangeValues(event: any, templateId: any) {
    console.log('templateId: ', templateId);
    console.log('event: ', event);
    this.templateId = templateId;
    if (!event?.isModified || !event?.changed?.component?.key) return;
    let isValid = true;
    const key = event.changed.component.key;
    const value = event.changed.value;
    if (!this.finalUpdatedData[templateId]) {
      this.finalUpdatedData[templateId] = {};
    }
    this.isModified = true;
    const fieldKey = event.changed.component.key;
    const fieldValue = event.changed.value;
    const index = fieldKey.split('_')[2];
    if (event.changed?.component?.type === 'datetime' && value) {
      const validateWeekend = this.isWeekend(value);

      if (validateWeekend) {
        this.bbToaster.show_info('You have selected a weekend');
      }
    }
    // ---- ACTUAL START DATE VALIDATION ----
    if (key.startsWith("kpi_actualStartDate_") && value !== "") {
      const actualEnd = event.data[`kpi_actualEndDate_${index}`];
      const targetStartDate_ = event.data[`kpi_targetStartDate_${index}`];
      const oldValue = event.changed?.component?.defaultValue ?? "";
      if (!targetStartDate_) {
        this.clearInputByName(key);
        return this.bbToaster.show_warn(
          "First choose target start date, then choose actual start date."
        );
      }
      if (actualEnd && value > actualEnd) {
        // revert to previous value instead of clearing
        if (this.transitionDataTable) {
          this.finalUpdatedData[templateId][key] = oldValue;
          this.transitionDataTable.updateFormComponent(key, oldValue);
        }
        await this.renderCards(true);
        await this.saveChanges();
        return this.bbToaster.show_warn(
          "Actual start date must be before the actual end date."
        );
      }
    }
    if (key.startsWith("kpi_actualStartDate_") && value === "") {
      if (this.transitionDataTable) {
        const actualEndKey = `kpi_actualEndDate_${index}`;

        this.finalUpdatedData[templateId][actualEndKey] = "";

        // clear actualEnd in UI
        this.transitionDataTable.updateFormComponent(actualEndKey, "");

        // clear actualStart in UI (optional but consistent)
        this.transitionDataTable.updateFormComponent(key, "");
      }
    }
    // ---- Target START DATE VALIDATION ----
    if (key.startsWith("kpi_targetStartDate_") && value !== "") {
      const actualEnd = event.data[`kpi_targetEndDate_${index}`];
      const oldValue = event.changed?.component?.defaultValue ?? "";

      if (actualEnd && value > actualEnd) {
        // revert to previous value instead of clearing
        if (this.transitionDataTable) {
          this.finalUpdatedData[templateId][key] = oldValue;
          this.transitionDataTable.updateFormComponent(key, oldValue);
        }
        await this.renderCards(true);
        await this.saveChanges();
        return this.bbToaster.show_warn(
          "Target start date must be before the target end date."
        );
      }
    }
    // ---- DATE VALIDATION ----
    if (key.startsWith("kpi_actualEndDate_") && value !== "") {
      const actualStart = event.data[`kpi_actualStartDate_${index}`];
      const oldValue = event.changed?.component?.defaultValue ?? "";
      if (actualStart === "") {
        isValid = false;
        if (this.transitionDataTable) {
          this.finalUpdatedData[templateId][key] = oldValue;
          this.transitionDataTable.updateFormComponent(key, oldValue);
        }
        return this.bbToaster.show_warn("First choose actual start date, then choose actual end date.");
      }
      if (actualStart > value) {
        isValid = false;
        if (this.transitionDataTable) {
          this.finalUpdatedData[templateId][key] = oldValue;
          this.transitionDataTable.updateFormComponent(key, oldValue);
        }
        return this.bbToaster.show_warn("Actual end date must be after the actual start date.");
      }
    }
    if (key.startsWith("kpi_targetEndDate_") && value !== "") {
      // const _actualStart = event.data[`kpi_actualStartDate_${index}`];
      const targetStartDate_ = event.data[`kpi_targetStartDate_${index}`];
      const oldValue = event.changed?.component?.defaultValue ?? "";

      if (targetStartDate_ === "") {
        isValid = false;
        if (this.transitionDataTable) {
          this.finalUpdatedData[templateId][key] = oldValue;
          this.transitionDataTable.updateFormComponent(key, oldValue);
        }
        return this.bbToaster.show_warn("First choose target start date, then choose target end date.");
      } else if (targetStartDate_ > value) {
        isValid = false;
        if (this.transitionDataTable) {
          this.finalUpdatedData[templateId][key] = oldValue;
          this.transitionDataTable.updateFormComponent(key, oldValue);
        }
        return this.bbToaster.show_warn("Target end date must be after the target start date.");
      }
    }
    if (isValid) {
      if (key.startsWith('kpi_owner_')) {
        const loginNameUsers =
          this.actionLists
            ?.filter((item: any) => value?.includes(item.label))
            ?.flatMap((item: any) => item.data || [])
            ?.map((user: any) => user.loginName) || [];


        // Form.io dropdown format
        const dropdownValues = loginNameUsers.map((name: string) => ({
          label: name,
          value: name
        }));
        const findKey: any = Object.keys(event?.data || {})
          .find(key => key.startsWith(`kpi_stakeholder_${index}`));
        const tableInstance = this.getTableInstance(templateId);
        if (tableInstance) {
          tableInstance?.updateFormDropdownValueComponent(
            findKey,
            dropdownValues
          );
        }
      }
      // store updated
      this.finalUpdatedData[templateId][fieldKey] = fieldValue;
      // ---- AUTO STATUS & SCORE ----
      const actualStart = event.data[`kpi_actualStartDate_${index}`];
      const targetEnd = event.data[`kpi_targetEndDate_${index}`];
      const targetStart = event.data[`kpi_targetStartDate_${index}`];
      const actualEnd = event.data[`kpi_actualEndDate_${index}`];
      const statusVal = event.data[`kpi_status_${index}`];
      let status = statusVal;
      let score: number | string = 0;
      const today = new Date().toISOString().split("T")[0] ?? ''; // yyyy-mm-dd
      const tEnd = targetEnd ? targetEnd.split("T")[0] : "";
      const aEnd = actualEnd ? actualEnd.split("T")[0] : "";
      const aStart = actualStart ? actualStart.split("T")[0] : "";
      // if (value === "N/A") {
      //   score = "";
      // } else {
      if (!aStart &&
        !aEnd &&
        targetStart &&
        tEnd &&
        today <= tEnd) {
        status = "Yet To Start";
        score = "";
      } else if (aEnd && tEnd && aEnd <= tEnd) {
        status = "Completed";
        score = 10;
      } else if (aEnd && tEnd && aEnd > tEnd) {
        status = "Completed With Delay";
        score = 10;
      } else if (
        !aStart &&
        !aEnd &&
        ((targetStart && today > targetStart.split("T")[0]) || (tEnd && today > tEnd))
      ) {
        status = "Overdue";
        score = "";
      } else if (aStart && !aEnd) {
        status = "In Progress";
        score = 5;
      } else {
        status = "N/A";
        score = "";
      }
      // }
      if (index) {
        this.finalUpdatedData[templateId][`kpi_status_${index}`] = status;
        this.finalUpdatedData[templateId][`kpi_score_${index}`] = score;
      }
      // ✅ update only correct table instance
      const tableInstance = this.getTableInstance(templateId);
      if (tableInstance) {
        tableInstance.updateFormComponent(fieldKey, fieldValue);
        tableInstance.updateFormComponent(`kpi_status_${index}`, status);
        tableInstance.updateFormComponent(`kpi_score_${index}`, score);
      }

      await this.renderCards(true);
      await this.saveChanges();
    }
  }

  private async saveChanges() {
    const isUpdateCurrentChanges = !!this.templateData?.transitionDetails?.find(
      (val: any) =>
        val.oTemplateId === this.templateId &&
        !val.KpiValues
    );
    const payload = {
      id: this.transitionId,
      type: "kpiTransition",
      templateId: this.templateId,
      updatedData: this.finalUpdatedData,
      userId: this.userId,
      isModified: this.isModified,
      isUpdateCurrentChanges: isUpdateCurrentChanges,

      summary: this.phases_list?.map((item: any) => {
        return {
          cPhaseId: item.phase_id,
          kpi_score: item.score
        }
      })

    };
    this.transitionService.emitData("updateTransitionTemplate", payload)
  }

  async processData(templateFormData: any[], commentsData: any[]) {
    // console.log('commentsData:Inside Process Data::: ', commentsData);
    const finalData: Record<string, any>[] = [];

    const companyName = `Company name: ${this.templateData?.cCompanyName || ""}`;
    const productName = `Product name: ${this.templateData?.cProductName || ""}`;

    templateFormData.forEach((section: any, sectionIndex: number) => {
      const complianceScore = section.score || 0;
      const phaseName = section.phaseName
        ? `${section.phaseName} - Compliance Score: ${complianceScore}%`
        : 'Untitled Phase';

      const kpiComponent = section.components?.[0];
      if (!Array.isArray(kpiComponent?.rows)) return;

      let headers: string[] = [];
      const headerRow = kpiComponent.rows[0];

      headerRow.forEach((col: any, index: number) => {
        const headerLabel = col?.components?.[0]?.label || `Column ${index + 1}`;
        headers.push(headerLabel);
      });
      // Add Company + Product 
      if (sectionIndex === 0) {
        const companyProductRow: Record<string, any> = {};
        const key0 = headers[0] ?? 'Column 1';
        companyProductRow[key0] = companyName;
        const key1 = headers[1] ?? 'Column 2';
        if (headers[1]) companyProductRow[key1] = productName;
        headers.slice(2).forEach(header => {
          if (header) companyProductRow[header] = '';
        });
        finalData.push(companyProductRow);
      }

      // Add phase name row
      const phaseNameRow: Record<string, any> = {};
      const key0 = headers[0] ?? 'Column 1';
      phaseNameRow[key0] = phaseName;
      headers.slice(1).forEach(header => (phaseNameRow[header] = ''));
      finalData.push(phaseNameRow);

      // Process rows
      kpiComponent.rows.slice(1).forEach((row: any[]) => {
        const rowData: Record<string, any> = {};
        const rowKey = headers[0] ?? 'Column 1';
        rowData[rowKey] = phaseName;

        row.forEach((col: any, colIndex: number) => {
          const comp = col?.components?.[0];
          if (!comp) return;

          const label = headers[colIndex];
          let value = comp.defaultValue;
          let defaultValue = comp.defaultValue;
          // 🔹 Handle portal_action select mapping
          if (comp.key.startsWith("kpi_portal_action_")) {
            const matchedOption = comp?.data?.values?.find(
              (val: any) => val?.value === defaultValue
            );
            value = matchedOption?.label || "";
          }

          if (comp.type === "select") {
            if (Array.isArray(value)) {
              value = value.join(", ");
            } else {
              value = value || "";
            }
          }
          // Handle text fields
          else if (comp.type === "textfield" || comp.type === "textfield") {
            value = value || "";
          }
          // Format date
          else if (comp.type === 'datetime' && value && !isNaN(Date.parse(value))) {
            value = value ? moment(value).format(this.defDateFormat) : "";
            // new Date(value).toLocaleString('en-US', {
            //   month: 'numeric',
            //   day: 'numeric',
            //   year: 'numeric'
            //   // hour: '2-digit',
            //   // minute: '2-digit',
            //   // hour12: true
            // });
          } else if (comp.type === 'datetime') {
            value = "";
          }
          // Arrays to comma-separated
          else if (Array.isArray(value)) {
            value = value.join(', ');
          }
          // Handle empty selects or text fields
          else if (comp.type === "button" && colIndex === row.length - 1) {
            const matchingComments = commentsData
              // .filter(c => c.key === comp.key && section?._id === comp?.oTemplateId)
              // .filter(c => c.key === comp.key)
              .filter(c =>
                c.key === comp.key &&
                (
                  !section?._id || !c.oTemplateId || section?._id === c.oTemplateId
                )
              )
              .map((c: { cCreatedBy: any; cComment: any; cCreatedAt: string; }) => {
                const formattedDate = c.cCreatedAt ? moment(c.cCreatedAt).format(this.defDateFormat) : c.cCreatedAt
                // new Date(c.cCreatedAt).toLocaleString('en-US', {
                //   month: '2-digit',
                //   day: '2-digit',
                //   year: 'numeric',
                //   hour: '2-digit',
                //   minute: '2-digit',
                //   hour12: true
                // }).replace(',', '');

                return `• ${formattedDate} | ${c.cCreatedBy} | ${c.cComment}`;
              })
              .join(' | ');
            // If no comments found, set blank or placeholder instead of showing badge HTML
            value = matchingComments || "";
          } else if ((value == null || value === '') && label !== 'Comments') {
            value = comp.label || '';
          }

          if (label) {
            rowData[label] = value;
          }
        });

        finalData.push(rowData);
      });
    });

    return finalData;
  }

  async getExportContext() {
    this.isExporting = true;
    await this.loadTemplatMapping();
    let commentsData = this.templateData?.transition_comments;
    this.exportdata = await this.processData(this.templateFormData, commentsData);
    return {
      formData: this.exportdata,
      isExporting: true,
      htmlSection: this.htmlSection,
      filename: 'Transition_KPI_Summary'
    };
  }
}
