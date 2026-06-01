import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild, inject } from "@angular/core";
import { TransitionDataTableComponent } from "../../common/transition-data-table/transition-data-table.component";
// import { FormsService } from "projects/BBForms-ui/src/public-api";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import { firstValueFrom } from "rxjs";
import { BBLoaderService, BbStoreService, BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { ButtonModule } from "primeng/button";
import { AccordionModule } from "primeng/accordion";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Knob } from "primeng/knob";
// import { ActivatedRoute } from "@angular/router";
import { CommonModule } from "@angular/common";
import { BadgeModule } from "primeng/badge";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
// import { DatePicker } from "primeng/datepicker";
// import { FloatLabel } from "primeng/floatlabel";
import { Menu } from "primeng/menu";
// import { DateRangePickerComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { ToastModule } from "primeng/toast";
// import { ExcelService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service";
import { MenuItem } from "primeng/api";
import { TooltipModule } from "primeng/tooltip";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable"; //temporary
// import * as htmlToImage from "html-to-image";
import moment from "moment";
import { DynamicTableComponent } from "../dynamic-table/dynamic-table.component";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { CustomerPortalService } from "projects/crm-customer-portal-transition-ui/shared/customer-portal/customer-portal.service";
@Component({
  selector: "app-transition-checklist",
  imports: [
    TransitionDataTableComponent,
    ButtonModule,
    AccordionModule,
    Knob,
    BadgeModule,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    ToastModule,
    TooltipModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule, Menu,
    // DynamicTableComponent
  ],
  templateUrl: "./transition-checklist.component.html",
  styleUrl: "./transition-checklist.component.scss",
})
export class TransitionChecklistComponent {
  // private formService = inject(FormsService);
  private transitionService = inject(TransitionService);
  private bbLoader = inject(BBLoaderService);
  private bbToaster = inject(BBToastService);
  // private route = inject(ActivatedRoute);
  // private excelService = inject(ExcelService);
  private cdr = inject(ChangeDetectorRef);
  private bbStore = inject(BbStoreService);
  private categoryService = inject(CategoriesService);
  private customerPortalService = inject(CustomerPortalService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }
  @ViewChild('transitionDataTable') transitionDataTable!: TransitionDataTableComponent;
  @Output() onChangeTransitionPhase = new EventEmitter<any>();
  @ViewChild(DynamicTableComponent) dynamicTableComponent!: DynamicTableComponent;
  @Output() exportRequested = new EventEmitter<string>();
  @Input() hideCheckList = false;
  @Input() isUpdated = false;
  @Input() searchTerm = "";
  transitionPeriod: any;
  plannedGoLiveDate: any = null;
  // private observer!: MutationObserver;
  formKnob!: FormGroup;
  formData: any;
  originalFormData: any;
  template: any;
  phases_list: any;
  original_phases_list: any;
  templateId!: string;
  showPhasesTransition: boolean = false;
  isModified: boolean = false;
  phases_table: boolean = false;
  phaseName!: string;
  transitionId!: any;
  templateData: any = null;
  initialTemplate: any = null;
  finalUpdatedData: any = {}; // ✅ Ensure it's initialized
  sampleJson: any = {};
  formTableValue: any = {
    tableData: [],
    headers: []
  };
  excelItems: MenuItem[] = [
    { label: "Export Excel", icon: "pi pi-file-excel", command: () => this.exportRequested.emit("EXCEL") },
    { label: "Export CSV", icon: "pi pi-file", command: () => this.exportRequested.emit("CSV") },
    { label: "Export PDF", icon: "pi pi-file-pdf", command: () => this.exportRequested.emit("PDF") },
  ];
  @ViewChild("setFormIoWidth", { static: false }) setFormIoWidth!: ElementRef;
  @ViewChild("htmlSection") htmlSection?: ElementRef;
  @ViewChild("filename") filename!: ElementRef;
  Math = Math;
  defaultDateRange: any;
  isExporting: boolean = false;
  enableHeight: boolean = false;
  // private saveTimer: any;
  defDateFormat: any;
  defTimeZone: any;
  actionLists: any = [];
  users: any = [];
  employeeList: any = [];
  contacts: any = [];
  isCustomerPortal: boolean = false;

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
  userId: any;
  actionOwnerList: any = [];
  isCustomerActionList: any = [];
  async ngOnInit() {
    this.transitionId = history.state._id;
    this.transitionData = history.state.data;
    console.log('this.transitionData: ', this.transitionData);
    this.isCustomerPortal = history.state.data?.isCustomerPortal ?? false;
    await this.loadUsers();
    await this.loadContactListAgainstAccount();
    await this.loadActionOwners();
    this.userId = this.bbStore.getItem("userId");
    this.defTimeZone = this.bbStore.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey") || 'mm/dd/yyyy');
    this.formKnob = new FormGroup({
      value: new FormControl(32),
    });
    const today = this.formatDate(new Date());
    this.transitionPeriod = {
      startDate: today,
      endDate: today,
    };
    if (this.transitionId && this.templateData === null) {
      await this.loadTemplatMapping();
    }
    await this.listenForUpdates();
    this.enableHeight = this.phases_list?.length < 6;
    if (this.isCustomerPortal) {
      await this.checkTransitionCustomerRole();
    }
  }
  async checkTransitionCustomerRole() {

    try {
      const response: any = await firstValueFrom(this.customerPortalService.checkTransitionCustomerRole(this.templateData?._id))
      console.log('response: ', response);
      this.isCustomerActionList = response?.roles?.map((item: any) => item.role);
      console.log('this.isCustomerActionList: ', this.isCustomerActionList);

    } catch (error) {
      console.log('error: ', error);

    }
  }
  // async loadUsers(): Promise<void> {
  //   const users = (await this.categoryService.getUsers())?.sort((a: any, b: any) =>
  //     a.loginName?.localeCompare(b.loginName)
  //   );
  //   this.users = users
  //     .map((val: any) => ({
  //       label: val?.empId?.email,
  //       value: val?.empId?.email
  //     }));

  // }
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
        loginName: `${val.cDisplayName} - ${val.cEmail}`,
        email: val.cEmail,
        empName: val.cDisplayName
      }
    }) || [];
  }

  async ngOnChanges(changes: SimpleChanges) {
    console.log('changes: ', changes);
    if (changes["searchTerm"]) {
      await this.onSerchResult();
    }
    if (changes["isUpdated"]?.currentValue) {
      await this.loadTemplatMapping();
    }
  }

  async onSerchResult() {
    try {
      const term = this.searchTerm?.trim().toLowerCase();
      if (this.searchTerm === '') {
        this.phases_list = this.original_phases_list;
        this.formData = this.originalFormData;
      } else {
        this.phases_list = this.original_phases_list.filter((phase: any) =>
          Object.values(phase)
            .join(' ')
            .toLowerCase()
            .includes(term)
        );
        const rows = this.originalFormData.components[0].rows.filter(
          (row: any[], rowIndex: number) => {
            // ✅ Always keep header row
            if (rowIndex === 0) {
              return true;
            }

            // 🔍 Check search term in column html
            return row.some((column: any) =>
              column?.components?.some((comp: any) =>
                comp?.html?.toLowerCase().includes(term)
              )
            );
          }
        )
        this.formData = {
          ...this.originalFormData,
          components: [
            {
              ...this.originalFormData.components[0],
              rows: rows,
              numRows: rows.length
            }
          ]
        };
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
        console.log('recived data: ', data);
        if (data?.isSettingUpdated) {
          await this.saveChanges();
        }
        this.templateData = { ...this.templateData, ...data };
        if (this.templateData?.roles) {
          this.isCustomerActionList = this.templateData?.roles?.map((item: any) => item.role);
        }
        if (this.showPhasesTransition) {
          this.handleTransitionId(this.templateId)
        } else {
          this.loadTemplate();
        }
      }

    });
  }

  header = [
    {
      components: [
        {
          label: "ID",
          key: "id",
          type: "content",
          html: "ID",
          input: false,
          customClass: "table-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Phases",
          key: "Phases",
          type: "content",
          html: "Phases",
          input: false,
          customClass: "table-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Overall Compliance Score",
          key: "Overall Compliance Score",
          type: "content",
          html: "Overall Compliance Score",
          input: false,
          customClass: "table-header-cell common-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Overall Compliance Status",
          key: "Overall Compliance Status",
          type: "content",
          html: "Overall Compliance Status",
          input: false,
          customClass: "table-header-cell common-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Target Start Date",
          key: "Target Start Date",
          type: "content",
          html: "Target Start Date",
          input: false,
          customClass: "table-header-cell common-date-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Actual Start Date",
          key: "Actual Start Date",
          type: "content",
          html: "Actual Start Date",
          input: false,
          customClass: "table-header-cell common-date-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Target End Date",
          key: "Target End Date",
          type: "content",
          html: "Target End Date",
          input: false,
          customClass: "table-header-cell common-date-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Actual End Date",
          key: "Actual End Date",
          type: "content",
          html: "Actual End Date",
          input: false,
          customClass: "table-header-cell common-date-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Duration",
          key: "Duration",
          type: "content",
          html: "Duration",
          input: false,
          customClass: "table-header-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Comment",
          key: "Comment",
          type: "content",
          html: "Comment",
          input: false,
          customClass: "table-header-cell",
          tableView: false,
        },
      ],
    },
  ];
  sampleJsonTemplate: any = [
    {
      components: [
        {
          label: "1",
          key: "ID",
          type: "content",
          html: "1",
          input: false,
          customClass: "id-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "Contracting",
          customClass: "icon-only-btn phase-column-link",
          tableView: false,
          key: "Phases",
          type: "button",
          saveOnEnter: false,
          input: true,
          action: "event",
          event: "movePhase",
        },
      ],
    },
    {
      components: [
        {
          key: "score_status",
          label: "0%",
          html: "0%",
          customClass: "score_status",
          type: "content",
          input: false,
          tableView: true,
          hideLabel: true,
          disabled: true,
        },
      ],
    },
    {
      components: [
        {
          key: "status",
          label: "PENDING",
          type: "content",
          html: "PENDING",
          input: false,
          customClass: "status-ash",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          key: "targetStartDate",
          label: "Date",
          type: "content",
          html: "",
          input: false,
          customClass: "table-row-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          key: "actualStartDate",
          label: "Date",
          type: "content",
          html: "",
          input: false,
          customClass: "table-row-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          key: "targetEndDate",
          label: "Date",
          type: "content",
          html: "",
          input: false,
          customClass: "table-row-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          key: "actualEndDate",
          label: "Date",
          type: "content",
          html: "",
          input: false,
          customClass: "table-row-cell",
          tableView: false,
        },
      ],
    },
    {
      components: [
        {
          label: "",
          key: "duration",
          type: "content",
          html: "",
          input: false,
          customClass: "table-row-cell",
          tableView: true,
          hideLabel: true,
          disabled: true,
        },
      ],
    },
    {
      components: [
        {
          type: "button",
          label: "<span class='badge-count'></span>",
          key: "commentIconBtn",
          leftIcon: "bi bi-chat-left-dots",
          customClass: "icon-only-btn with-badge",
          action: "event",
          event: "openCommentModal",
          input: true,
          tableView: false,
          "labelPosition": "right",
          "attrs": [
            {
              "attr": "style",
              "value": "position: relative;"
            }
          ]
        },
      ],
    },
  ];

  async loadTemplatMapping() {
    this.bbLoader.showLoader();

    try {
      const temp = await firstValueFrom(
        this.transitionService.getByIdTemplateMapping(this.transitionId)
      );
      this.templateData = temp?.data;
      console.log('this.templateData: ', this.templateData);
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
    /* ===================== HELPERS ===================== */
    const isMilestoneKey = (key: string, milestoneNo: number, prefix: string) =>
      key.startsWith(prefix) && key.endsWith(`M${milestoneNo}`);

    const getMilestoneDate = (
      entries: [string, any][],
      milestoneNo: number,
      prefix: string,
      mode: 'min' | 'max'
    ): string | null => {
      const dates = entries
        .filter(([k, v]) => isMilestoneKey(k, milestoneNo, prefix) && v)
        .map(([, v]) => v);
      if (!dates.length) return null;
      return mode === 'min'
        ? dates.reduce((a, b) => (a < b ? a : b))
        : dates.reduce((a, b) => (a > b ? a : b));
    };

    const getDate = (entries: [string, any][], prefix: string, mode: 'min' | 'max'): string | null => {
      const filteredDates = entries
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([, value]) => value);
      if (filteredDates.length === 0) return null;
      return mode === 'min'
        ? filteredDates.reduce((min: any, curr: any) => (new Date(curr) < new Date(min) ? new Date(curr) : new Date(min)))
        : filteredDates.reduce((max: any, curr: any) => (new Date(curr) > new Date(max) ? new Date(curr) : new Date(max)));
    };

    const getDateMileStone = (
      entries: [string, any][],
      prefix: string,
      mode: 'min' | 'max'
    ): string | null => {
      const filteredDates: any = entries
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([, value]) => value as string);
      if (filteredDates.length === 0) return null;
      return mode === 'min'
        ? filteredDates.reduce((min: any, curr: any) => (new Date(curr) < new Date(min) ? new Date(curr) : new Date(min)))
        : filteredDates.reduce((max: any, curr: any) => (new Date(curr) > new Date(max) ? new Date(curr) : new Date(max)));
    };

    const formatDate = (dateString: string | null): string | null => {
      if (!dateString) return null;
      const date = new Date(dateString);
      date.setHours(7, 0, 0, 0);
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

    const getColor = (status: string) =>
      ['COMPLETED', 'COMPLETED ON TIME'].includes(status) ? '#00AB55'
        : ['COMPLETED WITH DELAY', 'OVERDUE'].includes(status) ? '#8C0000'
          : status === 'IN PROGRESS' ? '#FF6D00' : '#3A423E';

    const getStatusClass = (status: string) =>
      ['COMPLETED', 'COMPLETED ON TIME'].includes(status) ? 'status-green'
        : ['COMPLETED WITH DELAY', 'OVERDUE'].includes(status) ? 'status-red'
          : status === 'IN PROGRESS' ? 'status-orange' : 'status-ash';

    const calculateDuration = (startDate: string | null, endDate: string | null): string | null => {
      if (!startDate || !endDate) return null;
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 0) return null;
      const years = Math.floor(daysDiff / 365);
      const days = daysDiff % 365;
      return years > 0 ? `${years} years, ${days} days` : `${days} days`;
    };

    /* ===================== MAIN ===================== */
    this.phases_list =
      this.phases_list && !isUpdated
        ? this.phases_list
        : this.templateData?.phase_info?.map((item: any) => {
          const phaseDetail = this.templateData?.transitionDetails
            ?.find((v: any) => v.oPhaseId === item._id);

          const templateDetail = this.templateData?.template_info
            ?.find((v: any) => v._id === phaseDetail?.oTemplateId);

          const milestoneIndex = phaseDetail.iSortOrder;

          const entries: [string, any][] =
            isUpdated && item.oTemplateId === this.templateId
              ? Object.entries(this.finalUpdatedData || {})
              : Object.entries(phaseDetail?.componentValues || {});

          /* ----------- GET MILESTONE LABELS ----------- */
          const milestone: string[] = [];
          templateDetail?.components?.[0]?.rows?.forEach((row: any[]) => {
            row.forEach(col => {
              col?.components?.forEach((c: any) => {
                if (c?.key?.startsWith('subheading_milestone_')) {
                  milestone.push(c.label);
                }
              });
            });
          });

          let result: any = {};
          let score = 0;
          let status = 'PENDING';
          let durationInDays: string | null = null;

          if (milestone.length === 0) {
            /* ===================== NON-MILESTONE PHASE LOGIC ===================== */
            const validStatusCount = entries.filter(
              ([k, v]) => k.startsWith('status_') && v && v !== 'N/A'
            ).length;

            const totalScore = entries
              .filter(([k]) => k.startsWith('score_'))
              .reduce((sum, [, v]: any) => sum + Number(v || 0), 0);

            score = validStatusCount > 0
              ? Math.round((totalScore / (validStatusCount * 10)) * 100) : 0;

            const minTargetStartDate = formatDate(getDate(entries, 'targetStartDate_', 'min'));
            const maxTargetEndDate = formatDate(getDate(entries, 'targetEndDate_', 'max'));
            const minActualStartDate = formatDate(getDate(entries, 'actualStartDate_', 'min'));
            const maxActualEndDate = formatDate(getDate(entries, 'actualEndDate_', 'max'));

            if (minActualStartDate && maxActualEndDate) {
              durationInDays = calculateDuration(minActualStartDate, maxActualEndDate);
            }

            const possibleStatus = entries.some(([k]) => k.startsWith('score_')) ? score : null;
            const today = moment().format(this.defDateFormat);
            status = entries.some(
              ([k, v]: any) => k.startsWith('status_') && v?.toUpperCase() === 'COMPLETED WITH DELAY'
            ) ? 'COMPLETED WITH DELAY'
              : !minActualStartDate && !maxActualEndDate && minTargetStartDate && minTargetStartDate < today
                ? 'OVERDUE' : getStatus(possibleStatus, maxActualEndDate, maxTargetEndDate);

            let isHide = false;
            if (this.transitionData?.isCustomerPortal) {
              const portal_action =
                templateDetail?.components?.[0]?.rows
                  ?.flatMap((row: any[]) => row.flatMap((col: any) => col?.components || []))
                  ?.filter((c: any) => c?.key?.startsWith('portal_action_'))
                  ?.reduce((acc: any, c: any) => { acc[c.key] = c.defaultValue; return acc; }, {}) || {};

              const mergedActions = { ...portal_action, ...Object.fromEntries(entries) };
              const finalValue = Object.entries(mergedActions).filter(([k]: any) => k.startsWith(`portal_action_`));

              isHide = finalValue?.length > 0 ? finalValue.every(
                ([, v]: any) => typeof v === "string" && v.toUpperCase() === "INTERNAL_USE_ONLY"
              ) : false;
            }

            result = {
              isHide,
              [`score_status_${milestoneIndex}`]: status === 'OVERDUE' ? '-' : `${score}%`,
              score_template: status === 'OVERDUE' ? '-' : `${score}%`,
              score: status === 'OVERDUE' ? 100 : score,
              status,
              color: getColor(status),
              status_color: getStatusClass(status),
              [`status_${milestoneIndex}`]: status,
              [`actualStartDate_${milestoneIndex}`]: minActualStartDate,
              [`targetStartDate_${milestoneIndex}`]: minTargetStartDate,
              [`targetEndDate_${milestoneIndex}`]: maxTargetEndDate,
              [`actualEndDate_${milestoneIndex}`]:
                ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status)
                  ? maxActualEndDate : null,
              [`duration_${milestoneIndex}`]:
                ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status)
                  ? durationInDays : null
            };
          } else {
            /* ===================== MILESTONE PHASE LOGIC ===================== */
            let milestoneResult: any = {};
            let allScores: number[] = [];
            let milestoneDates = {
              minTargetStartDate: null as string | null,
              maxTargetEndDate: null as string | null,
              minActualStartDate: null as string | null,
              maxActualEndDate: null as string | null,
            };

            milestone.forEach((_, idx) => {
              const suffix = idx + 1;
              const milestonePrefix = `M${suffix}`;
              if (this.transitionData?.isCustomerPortal) {
                const portal_action =
                  templateDetail?.components?.[0]?.rows
                    ?.flatMap((row: any[]) => row.flatMap((col: any) => col?.components || []))
                    ?.filter((c: any) => c?.key?.startsWith('portal_action_'))
                    ?.reduce((acc: any, c: any) => { acc[c.key] = c.defaultValue; return acc; }, {}) || {};

                const mergedActions = { ...portal_action, ...Object.fromEntries(entries) };

                const finalValue = Object.entries(mergedActions)
                  .filter(([k]: any) =>
                    k.startsWith(`portal_action_`) &&
                    (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`) || k.endsWith(`${milestonePrefix}`))
                  );

                const customer = finalValue?.length > 0 ? finalValue.every(
                  ([, v]: any) => typeof v === 'string' && v.toUpperCase() === 'INTERNAL_USE_ONLY'
                ) : false;
                milestoneResult[`isCustomerAccess_${milestonePrefix}`] = customer;
              }

              const validStatusCount = entries.filter(
                ([k, v]) =>
                  (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) &&
                  k.startsWith('status_') && v && v !== 'N/A'
              ).length;

              const totalScore = entries
                .filter(([k]) =>
                  (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) && k.startsWith('score_')
                )
                .reduce((sum, [, v]: any) => sum + Number(v || 0), 0);

              const milestoneScore = validStatusCount > 0
                ? Math.round((totalScore / (validStatusCount * 10)) * 100) : 0;
              allScores.push(milestoneScore);

              const milestoneTargetStartDate = formatDate(getMilestoneDate(entries, suffix, 'targetStartDate_', 'min'));
              const milestoneTargetEndDate = formatDate(getMilestoneDate(entries, suffix, 'targetEndDate_', 'max'));
              const milestoneActualStartDate = formatDate(getMilestoneDate(entries, suffix, 'actualStartDate_', 'min'));
              const milestoneActualEndDate = formatDate(getMilestoneDate(entries, suffix, 'actualEndDate_', 'max'));

              const possibleMilestoneStatus = entries.some(
                ([k]) =>
                  (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) && k.startsWith('score_')
              ) ? milestoneScore : null;

              const today = moment().format(this.defDateFormat);
              const milestoneStatus = entries.some(
                ([k, v]: any) =>
                  (k.includes(` ${milestonePrefix} `) || k.endsWith(` ${milestonePrefix}`)) &&
                  k.startsWith('status_') && v?.toUpperCase() === 'COMPLETED WITH DELAY'
              ) ? 'COMPLETED WITH DELAY'
                : !milestoneActualStartDate && !milestoneActualEndDate && milestoneTargetStartDate && milestoneTargetStartDate < today
                  ? 'OVERDUE' : getStatus(possibleMilestoneStatus, milestoneActualEndDate, milestoneTargetEndDate);

              const milestoneDuration = calculateDuration(milestoneActualStartDate, milestoneActualEndDate);

              milestoneResult[`score_status_${milestonePrefix}`] = milestoneStatus === 'OVERDUE' ? '-' : `${milestoneScore}%`;
              milestoneResult[`milestoneScore_${milestonePrefix}`] = milestoneStatus === 'OVERDUE' ? 0 : milestoneScore;
              milestoneResult[`actualStartDate_${milestonePrefix}`] = milestoneActualStartDate;
              milestoneResult[`targetEndDate_${milestonePrefix}`] = milestoneTargetEndDate;
              milestoneResult[`targetStartDate_${milestonePrefix}`] = milestoneTargetStartDate;
              milestoneResult[`actualEndDate_${milestonePrefix}`] =
                ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(milestoneStatus) ? milestoneActualEndDate : null;
              milestoneResult[`duration_${milestonePrefix}`] =
                milestoneDuration && ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(milestoneStatus) ? milestoneDuration : null;
              milestoneResult[`status_${milestonePrefix}`] = milestoneStatus;
              milestoneResult[`status_color_${milestonePrefix}`] = getStatusClass(milestoneStatus);
            });

            const milestoneTargetStartDate = formatDate(getDateMileStone(Object.entries(milestoneResult), 'targetStartDate_', 'min'));
            const milestoneTargetEndDate = formatDate(getDateMileStone(Object.entries(milestoneResult), 'targetEndDate_', 'max'));
            const milestoneActualStartDate = formatDate(getDateMileStone(Object.entries(milestoneResult), 'actualStartDate_', 'min'));
            const milestoneActualEndDate = formatDate(getDateMileStone(Object.entries(milestoneResult), 'actualEndDate_', 'max'));

            if (milestoneTargetStartDate && (!milestoneDates.minTargetStartDate || milestoneTargetStartDate < milestoneDates.minTargetStartDate)) milestoneDates.minTargetStartDate = milestoneTargetStartDate;
            if (milestoneTargetEndDate && (!milestoneDates.maxTargetEndDate || milestoneTargetEndDate > milestoneDates.maxTargetEndDate)) milestoneDates.maxTargetEndDate = milestoneTargetEndDate;
            if (milestoneActualStartDate && (!milestoneDates.minActualStartDate || milestoneActualStartDate < milestoneDates.minActualStartDate)) milestoneDates.minActualStartDate = milestoneActualStartDate;
            if (milestoneActualEndDate && (!milestoneDates.maxActualEndDate || milestoneActualEndDate > milestoneDates.maxActualEndDate)) milestoneDates.maxActualEndDate = milestoneActualEndDate;

            score = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;
            const possibleStatus = entries.some(([k]) => k.startsWith('score_')) ? score : null;
            const today = moment().format(this.defDateFormat);

            status = milestoneDates.minTargetStartDate === null && milestoneDates.maxTargetEndDate === null &&
              milestoneDates.minActualStartDate === null && milestoneDates.maxActualEndDate === null ? "PENDING" : entries.some(
                ([k, v]: any) => k.startsWith('status_') && v?.toUpperCase() === 'COMPLETED WITH DELAY'
              ) ? 'COMPLETED WITH DELAY'
              : !milestoneDates.minActualStartDate && !milestoneDates.maxActualEndDate && milestoneDates.minTargetStartDate && milestoneDates.minTargetStartDate < today
                ? 'OVERDUE' : getStatus(possibleStatus, milestoneDates.maxActualEndDate, milestoneDates.maxTargetEndDate);

            if (milestoneDates.minActualStartDate && milestoneDates.maxActualEndDate) {
              durationInDays = score === 100 ? calculateDuration(milestoneDates.minActualStartDate, milestoneDates.maxActualEndDate) : null;
            }

            result = {
              ...milestoneResult,
              overallCustomerAccess: Object.entries(milestoneResult)
                .filter(([k]) => k.startsWith('isCustomerAccess_'))
                .every(([, v]) => v === true) ?? false,
              [`score_status_${milestoneIndex}`]: status === 'OVERDUE' ? '-' : `${score}%`,
              score_template: status === 'OVERDUE' ? '-' : `${score}%`,
              score: status === 'OVERDUE' ? 100 : score,
              status,
              [`status_${milestoneIndex}`]: milestoneDates.minTargetStartDate === null &&
                milestoneDates.maxTargetEndDate === null && milestoneDates.minActualStartDate === null &&
                milestoneDates.maxActualEndDate === null ? "PENDING" : status === 'OVERDUE' ? status : score !== 100 ? "IN PROGRESS" : status,
              color: getColor(status),
              status_color: getStatusClass(status),
              [`actualStartDate_${milestoneIndex}`]: milestoneDates.minActualStartDate,
              [`targetStartDate_${milestoneIndex}`]: milestoneDates.minTargetStartDate,
              [`targetEndDate_${milestoneIndex}`]: milestoneDates.maxTargetEndDate,
              [`actualEndDate_${milestoneIndex}`]:
                durationInDays ? ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status) ? milestoneDates.maxActualEndDate : null : null,
              [`duration_${milestoneIndex}`]:
                durationInDays ? ['COMPLETED', 'COMPLETED ON TIME', 'COMPLETED WITH DELAY'].includes(status) ? durationInDays : null : null
            };
          }

          return {
            phaseName: item?.cPhaseName,
            phase_id: item?._id,
            _id: phaseDetail?.oTemplateId,
            milestone,
            ...result,
            iSortOrder: milestoneIndex
          };
        });

    if (this.transitionData?.isCustomerPortal) {
      this.phases_list = this.phases_list.map((phase: any) => {
        if (phase.overallCustomerAccess === true) {
          return null;
        }

        const updatedPhase = { ...phase };

        // Filter milestones and align property keys accurately to the new indexing 
        // to prevent mismatching properties (dates/duration) for the inner dynamic table.
        if (updatedPhase.milestone && Array.isArray(updatedPhase.milestone)) {
          const newMilestones: string[] = [];
          let newIndex = 1;

          updatedPhase.milestone.forEach((msName: string, originalIndex: number) => {
            const oldIndex = originalIndex + 1;
            if (!phase[`isCustomerAccess_M${oldIndex}`]) {
              newMilestones.push(msName);

              if (newIndex !== oldIndex) {
                updatedPhase[`score_status_M${newIndex}`] = phase[`score_status_M${oldIndex}`];
                updatedPhase[`milestoneScore_M${newIndex}`] = phase[`milestoneScore_M${oldIndex}`];
                updatedPhase[`actualStartDate_M${newIndex}`] = phase[`actualStartDate_M${oldIndex}`];
                updatedPhase[`targetEndDate_M${newIndex}`] = phase[`targetEndDate_M${oldIndex}`];
                updatedPhase[`targetStartDate_M${newIndex}`] = phase[`targetStartDate_M${oldIndex}`];
                updatedPhase[`actualEndDate_M${newIndex}`] = phase[`actualEndDate_M${oldIndex}`];
                updatedPhase[`duration_M${newIndex}`] = phase[`duration_M${oldIndex}`];
                updatedPhase[`status_M${newIndex}`] = phase[`status_M${oldIndex}`];
                updatedPhase[`status_color_M${newIndex}`] = phase[`status_color_M${oldIndex}`];
              }
              newIndex++;
            }
          });

          // Cleanup leftover properties from bounds to avoid overlap memory keys.
          for (let i = newIndex; i <= updatedPhase.milestone.length; i++) {
            delete updatedPhase[`score_status_M${i}`];
            delete updatedPhase[`milestoneScore_M${i}`];
            delete updatedPhase[`actualStartDate_M${i}`];
            delete updatedPhase[`targetEndDate_M${i}`];
            delete updatedPhase[`targetStartDate_M${i}`];
            delete updatedPhase[`actualEndDate_M${i}`];
            delete updatedPhase[`duration_M${i}`];
            delete updatedPhase[`status_M${i}`];
            delete updatedPhase[`status_color_M${i}`];
          }

          updatedPhase.milestone = newMilestones;
        }

        return updatedPhase;
      }).filter((phase: any) => phase !== null);
    }

    if (!this.original_phases_list) {
      this.original_phases_list = this.phases_list;
    }
    if (isUpdated) {
      this.original_phases_list = this.phases_list;
    }
  }

  async loadTemplate() {
    try {
      this.finalUpdatedData = {};
      if (this.templateData?.phasesTableValues) {
        if (this.templateData?.phasesTableValues?.transitionPeriod) {
          this.transitionPeriod = { startDate: this.convertDateToDDMMYYYY(this.templateData?.phasesTableValues?.transitionPeriod?.startDate), endDate: this.convertDateToDDMMYYYY(this.templateData.phasesTableValues?.transitionPeriod?.endDate) };
          this.defaultDateRange = this.templateData?.phasesTableValues?.transitionPeriod;
        }

        if (this.templateData.phasesTableValues?.plannedGoLiveDate) {

          this.plannedGoLiveDate = moment(this.templateData.phasesTableValues.plannedGoLiveDate).format(this.defDateFormat) || null;
        } else {
          this.plannedGoLiveDate = null; // show empty in calendar
        }

      }
      this.phases_table = true;
      await this.renderCards(false);
      this.phases_list = this.phases_list.sort((a: any, b: any) => a.iSortOrder - b.iSortOrder);

      console.log('this.phases_list: ', this.phases_list);
      // Step 2: Get updated template
      const payload = {
        header: this.header,
        sampleContentRow: this.sampleJsonTemplate,
        updatedContent: this.phases_list,
      };
      if (this.initialTemplate === null && this.transitionData?.isCustomerPortal) {
        const template = await firstValueFrom(this.transitionService.transitionTemplateJSON(payload));
        this.initialTemplate = template;
      } else {
        const template = await firstValueFrom(this.transitionService.transitionTemplateJSON(payload));
        this.initialTemplate = template;
      }
      this.finalUpdatedData = this.templateData?.phasesTableValues ?? {};
      // Step 3: Inject data into template
      this.initialTemplate?.data.components[0]?.rows?.forEach((row: any[]) => {
        row.forEach((column: any) => {
          if (!Array.isArray(column?.components)) return;

          column.components.forEach((component: any) => {
            const key = component?.key;
            if (!key) return;
            // // Set datepicker options
            // if (component.type === 'datetime') {
            //   component.datePicker = {
            //     "disableWeekends": true,
            //     "disableWeekdays": false
            //   };
            // }
            // Inject comment count badge
            const index = key.split("_")[1];
            if (key === `commentIconBtn_${index}`) {
              const count = this.templateData?.transition_comments?.filter((comment: any) => comment.key === key && comment.type === "checklist-phases" && comment.oTemplateId === null)?.length ?? 0
              component.leftIcon = "bi bi-chat-left-dots";
              if (count !== 0) {
                component.label =
                  `<span class='badge-count'>${count}</span>`;
              } else {
                component.label = null;
              }
            }

            // if (key.startsWith("status_")) {
            //   const status_color = component?.defaultValue === "Completed" ? "status-green" : component?.defaultValue === "In Progress" ? "status-orange" : component?.defaultValue === "Overdue" ? "status-red" : ""
            //   component.customClass = `${component.customClass} ${status_color}`;
            // }
            // 1. Inject default value if saved in finalUpdatedData
            if (this.finalUpdatedData?.hasOwnProperty(key)) {
              component.defaultValue = this.finalUpdatedData[key];
              return;
            }

            // // 2. Inject score status (label/html)
            // const scoreItem = this.phases_list?.find((item: any) => key in item);
            // if (scoreItem) {
            //   const value = scoreItem[key];
            //   component.label = value;
            //   component.html = value;
            //   if (["COMPLETED", "COMPLETED ON TIME"].includes(value)) {
            //     component.customClass = `status-green`;
            //   } else if (["COMPLETED WITH DELAY", "OVERDUE"].includes(value)) {
            //     component.customClass = `status-red`;
            //   } else if (value === "IN PROGRESS") {
            //     component.customClass = `status-orange`;
            //   } else if (value === "PENDING") {
            //     component.customClass = `status-ash`;
            //   }

            //   return;
            // }
          });
        });
      });

      // Step 4: Finalize formData
      this.formData = {
        ...this.initialTemplate?.data,
        oActivation_Id: this.templateData?.oActivation_Id,
        type: "checklist-phases",
        transitionId: this.templateData?._id
      };
      this.originalFormData = this.formData;
      console.log("template updated");
    } catch (error) {
      console.error("loadTemplate error:", error);
    }
  }

  async onClickPhaseLink(id: any) {
    try {
      this.bbLoader.showLoader()
      await this.handleTransitionId(id)
    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.cdr.detectChanges();
      this.bbLoader.hideLoader();
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

  async handleTransitionId(id: any) {
    try {
      // Reset states
      this.templateId = id;
      this.finalUpdatedData = {};
      this.phases_table = false;
      this.showPhasesTransition = true;
      this.onChangeTransitionPhase.emit(true);

      // Find transition detail for the given template ID
      const transitionDetail = this.templateData?.transitionDetails?.find(
        (val: any) => val?.oTemplateId === id
      );
      if (!transitionDetail) {
        console.warn("Template not found for ID:", id);
        return;
      }

      this.actionLists = this.templateData?.actionOwner?.map((val: any) => {
        const actionowner = this.actionOwnerList?.find((item: any) => item._id === val.actionOwnerId)?.cActionOwner;
        const users = this.employeeList?.filter((u: any) => val.users.includes(u._id));
        const contacts = this.contacts?.filter((u: any) => val.users.includes(u._id));

        return {
          label: actionowner,
          value: actionowner,
          data: [...users, ...contacts]
        }
      });

      // Get existing user IDs from actionLists
      const existingUserIds = new Set();
      this.actionLists?.forEach((item: any) => {
        if (item.data && Array.isArray(item.data)) {
          item.data.forEach((user: any) => {
            if (user?._id) {
              existingUserIds.add(user._id.toString());
            }
          });
        }
      });

      this.finalUpdatedData = transitionDetail.componentValues ?? {};

      // Find matching template info
      let templateDetail: any = this.templateData?.template_info?.find(
        (val: any) => val?._id === id
      );
      if (!templateDetail?.components?.length) {
        console.warn("No components found for template:", id);
        return;
      }

      let ownerdropdownvalue: any = [];
      // Loop through all components & sync values
      templateDetail.components[0]?.rows?.forEach((row: any[]) => {
        row.forEach((column: any) => {
          if (Array.isArray(column?.components)) {
            column.components.forEach((component: any) => {
              const key = component?.key;
              const index = key.split("_")[1];

              if (!key) return;
              if (this.templateData?.isActiveTransition && key !== `commentIconBtn_${index}`) {
                component.disabled = true;
              }
              if (component.type === 'datetime') {
                component.format = this.normalizeDateFormat(this.defDateFormat);

                // ensure widget object exists
                if (!component.widget) {
                  component.widget = {};
                }

                component.widget.type = 'calendar'; // important for flatpickr
                component.widget.format = this.normalizeDateFormat(this.defDateFormat);
              }

              // ---- AUTO STATUS & SCORE ----
              // const actualStart = this.finalUpdatedData[`actualStartDate_${index}`];
              // const targetEnd = this.finalUpdatedData[`targetEndDate_${index}`];
              // const targetStart = this.finalUpdatedData[`targetStartDate_${index}`];
              // const actualEnd = this.finalUpdatedData[`actualEndDate_${index}`];
              // const statusVal = this.finalUpdatedData[`status_${index}`];
              // let status = statusVal;
              // let score: number | string = 0;

              // const today = new Date().toISOString().split("T")[0] ?? ''; // yyyy-mm-dd
              // const tEnd = targetEnd ? targetEnd.split("T")[0] : "";
              // const aEnd = actualEnd ? actualEnd.split("T")[0] : "";
              // const aStart = actualStart ? actualStart.split("T")[0] : "";
              // if (statusVal === "N/A") {
              //   score = "";
              // } else if (!key.startsWith("status_")) {
              //   // Pending: only target dates exist and today is today or a future date
              //   if (
              //     !aStart &&
              //     !aEnd &&
              //     targetStart &&
              //     tEnd &&
              //     today <= tEnd
              //   ) {
              //     status = "Yet To Start";
              //     score = "";
              //   } else if (aEnd && tEnd && aEnd <= tEnd) {
              //     status = "Completed";
              //     score = 10;
              //   } else if (aEnd && tEnd && aEnd > tEnd) {
              //     status = "Completed With Delay";
              //     score = 10;
              //   } else if (!aStart && !aEnd && tEnd && today > tEnd) {
              //     status = "Overdue";
              //     score = 0;
              //   } else if (aStart && !aEnd) {
              //     status = "In Progress";
              //     score = 5;
              //   }
              // }
              // // Set datepicker options
              // if (component.type === 'datetime') {
              //   component.datePicker = {
              //     "disableWeekends": true,
              //     "disableWeekdays": false
              //   };
              // }
              // --- Comment badge count ---
              if (key === `commentIconBtn_${index}`) {
                const commentCount =
                  this.templateData?.transition_comments?.filter(
                    (comment: any) =>
                      comment.key === key &&
                      comment.type === "checklist" &&
                      comment?.oTemplateId === id
                  )?.length ?? 0;
                component.leftIcon = "bi bi-chat-left-dots";
                if (commentCount !== 0) {
                  component.label = `<span class='badge-count'>${commentCount}</span>`;
                } else {
                  component.label = null;
                }
              }
              if (key.startsWith('owner_')) {
                component.data = {
                  ...component.data,
                  values: this.actionLists
                }
                if (this.finalUpdatedData[key]?.length > 0) {
                  const loginNameUsers =
                    this.actionLists
                      ?.filter((item: any) => this.finalUpdatedData[key]?.includes(item.label))
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
              if (key.startsWith('stakeholder_')) {
                component.data = {
                  ...component.data,
                  values: ownerdropdownvalue
                }
              }

              // --- Sync default values ---
              if (this.finalUpdatedData.hasOwnProperty(key)) {
                if (key.startsWith("score_")) {
                  component.label = this.finalUpdatedData[key];
                  component.html = this.finalUpdatedData[key];
                } else {
                  if (key.startsWith('stakeholder_')) {
                    const selectedValues = component?.data?.values ?? [];
                    component.defaultValue = (this.finalUpdatedData[key] ?? []).filter(
                      (sh: any) => selectedValues.some(
                        (val: any) => val.value === sh
                      )
                    );
                  } else if (key.startsWith('owner_')) {
                    const selectedValues = component?.data?.values ?? [];
                    component.defaultValue = (this.finalUpdatedData[key] ?? []).filter(
                      (sh: any) => selectedValues.some(
                        (val: any) => val.value === sh
                      )
                    );
                  } else {
                    component.defaultValue = this.finalUpdatedData[key];
                  }
                }
              } else if (
                component.defaultValue !== undefined &&
                component.defaultValue !== null
              ) {
                this.finalUpdatedData[key] = component.defaultValue;
              }
            });
          }
        });
      });
      if (this.isCustomerPortal) {
        const originalTable = templateDetail.components[0];

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
                  component?.key?.startsWith("portal_action_") &&
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
              .find((comp: any) => comp?.key?.startsWith("portal_action_"))
              ?.defaultValue;

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
                  const isCommentBtn = key.startsWith("commentIconBtn_");
                  component.disabled = !isCommentBtn;
                } else {
                  component.disabled = true;
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
                      !component?.key?.startsWith("portal_action_")
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
          const newTableComponent = {
            ...originalTable,
            rows: newRows,
            numRows: newRows.length,
            numCols: newRows[0]?.length || 0
          };

          templateDetail = {
            ...templateDetail,
            components: [
              newTableComponent,
              ...templateDetail.components.slice(1)
            ]
          };
        }
      }
      // Set form data with only "phases_" component
      this.formData = {
        ...templateDetail,
        components: [
          templateDetail.components.find((value: any) =>
            value?.key?.startsWith("phases_")
          ),
        ],
        oActivation_Id: this.templateData?.oActivation_Id,
        templateId: id,
        type: "checklist",
        transitionId: this.templateData?._id
      };
      this.phaseName = this.phases_list?.find((item: any) => item._id === id)
        ?.phaseName;

    } catch (error) {
      console.error("Error in handleTransitionId:", error);
    }
  }

  async backToChecklist() {
    this.bbLoader.showLoader();
    try {
      const temp = await firstValueFrom(
        this.transitionService.getByIdTemplateMapping(this.transitionId)
      );
      this.templateData = temp?.data;
      await this.renderCards(true);
      await this.loadTemplate();
      this.showPhasesTransition = false;
      this.onChangeTransitionPhase.emit(false);
      console.log('complete code', this.formData);

    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.bbLoader.hideLoader()
    }
  }

  onDateChange(event: any) {
    this.transitionPeriod = event;
  }

  formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  async onSubmit() {
    // Injecting date values
    if (this.plannedGoLiveDate) {
      const date = new Date(this.plannedGoLiveDate);
      date.setHours(12, 0, 0, 0); // Set to 12:00:00
      this.plannedGoLiveDate = date;
    }
    this.finalUpdatedData["transitionPeriod"] = this.transitionPeriod;
    this.finalUpdatedData["plannedGoLiveDate"] = this.plannedGoLiveDate;
    const payload = {
      id: this.transitionId,
      type: this.phases_table ? "phases_table" : "checklist",
      templateId: this.templateId,
      updatedData: this.finalUpdatedData,
    };

    this.bbLoader.showLoader();
    try {
      this.transitionService.emitData("updateTransitionTemplate", payload)
    } catch (error) {
      console.log("error: ", error);
    } finally {
      this.bbLoader.hideLoader();
      this.loadTemplate();
      this.showPhasesTransition = false;
      this.onChangeTransitionPhase.emit(false);

      this.templateId = "";
    }
  }

  clearInputByName(fieldName: string) {
    const input = document.querySelector(`input[name="data[${fieldName}]"]`) as HTMLInputElement;
    if (input) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  private isWeekend(dateValue: any): boolean {
    const date = new Date(dateValue);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 || day === 6;
  }

  async onChangeValues(event: any) {
    if (event?.isModified && event?.changed?.component?.key) {
      console.log('event: ', event);
      this.isModified = true;
      const key = event.changed.component.key;
      const value = event.changed.value;
      const index = key.split("_")[1];
      let isValid = true;
      if (event.changed?.component?.type === 'datetime' && value) {
        const validateWeekend = this.isWeekend(value);
        if (validateWeekend) {
          this.bbToaster.show_info('You have selected a weekend');
        }
      }
      // ---- ACTUAL START DATE VALIDATION ----
      if (key.startsWith("actualStartDate_") && value !== "") {
        const actualEnd = event.data[`actualEndDate_${index}`];
        const targetStartDate_ = event.data[`targetStartDate_${index}`];
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
            this.finalUpdatedData[key] = oldValue;
            this.transitionDataTable.updateFormComponent(key, oldValue);
          }
          await this.renderCards(true);
          await this.saveChanges();
          return this.bbToaster.show_warn(
            "Actual start date must be before the actual end date."
          );
        }

      }
      if (key.startsWith("actualStartDate_") && value === "") {
        if (this.transitionDataTable) {
          const actualEndKey = `actualEndDate_${index}`;

          this.finalUpdatedData[actualEndKey] = "";

          // clear actualEnd in UI
          this.transitionDataTable.updateFormComponent(actualEndKey, "");

          // clear actualStart in UI (optional but consistent)
          this.transitionDataTable.updateFormComponent(key, "");
        }
      }
      // ---- Target START DATE VALIDATION ----
      if (key.startsWith("targetStartDate_") && value !== "") {
        const actualEnd = event.data[`targetEndDate_${index}`];
        const oldValue = event.changed?.component?.defaultValue ?? "";

        if (actualEnd && value > actualEnd) {
          // revert to previous value instead of clearing
          if (this.transitionDataTable) {
            this.finalUpdatedData[key] = oldValue;
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
      if (key.startsWith("actualEndDate_") && value !== "") {
        const actualStart = event.data[`actualStartDate_${index}`];
        const oldValue = event.changed?.component?.defaultValue ?? "";
        if (actualStart === "") {
          isValid = false;
          if (this.transitionDataTable) {
            this.finalUpdatedData[key] = oldValue;
            this.transitionDataTable.updateFormComponent(key, oldValue);
          }
          return this.bbToaster.show_warn("First choose actual start date, then choose actual end date.");
        }
        if (actualStart > value) {
          isValid = false;
          if (this.transitionDataTable) {
            this.finalUpdatedData[key] = oldValue;
            this.transitionDataTable.updateFormComponent(key, oldValue);
          }
          return this.bbToaster.show_warn("Actual end date must be after the actual start date.");
        }
      }
      if (key.startsWith("targetEndDate_") && value !== "") {
        // const actualStart = event.data[`actualStartDate_${index}`];
        const targetStartDate_ = event.data[`targetStartDate_${index}`];
        const oldValue = event.changed?.component?.defaultValue ?? "";

        if (targetStartDate_ === "") {
          isValid = false;
          if (this.transitionDataTable) {
            this.finalUpdatedData[key] = oldValue;
            this.transitionDataTable.updateFormComponent(key, oldValue);
          }
          return this.bbToaster.show_warn("First choose target start date, then choose target end date.");
        } else if (targetStartDate_ > value) {
          isValid = false;
          if (this.transitionDataTable) {
            this.finalUpdatedData[key] = oldValue;
            this.transitionDataTable.updateFormComponent(key, oldValue);
          }
          return this.bbToaster.show_warn("Target end date must be after the target start date.");
        }
      }
      if (isValid) {
        if (key.startsWith('owner_')) {
          if (value?.length > 0) {
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

            this.transitionDataTable?.updateFormDropdownValueComponent(
              `stakeholder_${index}`,
              dropdownValues
            );
          } else {
            this.transitionDataTable?.updateFormDropdownValueComponent(
              `stakeholder_${index}`,
              []
            );
          }
        }
        // Save changed field
        this.finalUpdatedData[key] = value;
        // ---- AUTO STATUS & SCORE ----
        const actualStart = event.data[`actualStartDate_${index}`];
        const targetEnd = event.data[`targetEndDate_${index}`];
        const targetStart = event.data[`targetStartDate_${index}`];
        const actualEnd = event.data[`actualEndDate_${index}`];
        const statusVal = event.data[`status_${index}`];
        let status = statusVal;
        let score: number | string = 0;
        const today = new Date().toISOString().split("T")[0] ?? ''; // yyyy-mm-dd
        const tEnd = targetEnd ? targetEnd.split("T")[0] : "";
        const aEnd = actualEnd ? actualEnd.split("T")[0] : "";
        const aStart = actualStart ? actualStart.split("T")[0] : "";
        // if (value === "N/A") {
        //   score = "";
        // } else {
        // Pending: only target dates exist and today is today or a future date
        if (
          !aStart &&
          !aEnd &&
          targetStart &&
          tEnd &&
          today <= tEnd
        ) {
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

        // Save status & score
        if (index) {
          if (status) this.finalUpdatedData[`status_${index}`] = status;
          this.finalUpdatedData[`score_${index}`] = score;
          if (score === "") {
            delete this.finalUpdatedData[`score_${index}`];
          }
        }
        // Update form components without re-render
        if (this.transitionDataTable && this.transitionDataTable.formInstance) {
          // Update the changed component
          this.transitionDataTable.updateFormComponent(key, value);
          // Update status component if it changed
          if (status && status !== event.data[`status_${index}`]) {
            const statusComp = this.transitionDataTable.formInstance.getComponent(`status_${index}`);
            if (statusComp) {
              // update defaultValue + value
              statusComp.component.defaultValue = status;
              statusComp.setValue(status, { noValidate: true, modified: false });
            }
          }
          // Update score component if it changed
          if (score !== event.data[`score_${index}`]) {
            this.transitionDataTable.updateFormComponent(`score_${index}`, score);
          }
        }
        await this.renderCards(true);
        await this.saveChanges();
      }
    }
  }

  private async saveChanges() {
    const payload = {
      id: this.transitionId,
      type: "checklist",
      templateId: this.templateId,
      updatedData: this.finalUpdatedData,
      userId: this.userId,
      isModified: this.isModified,
      summary: this.phases_list?.map((item: any) => {
        return {
          cPhaseId: item.phase_id,
          checklist_score: item?.status === "OVERDUE" ? 0 : item.score
        }
      })
    };

    this.transitionService.emitData("updateTransitionTemplate", payload)
  }

  async processData(formData: any) {
    const table = formData.components?.[0];
    if (!table) {
      console.error("No table component found");
      return [];
    }

    const rows = table.rows;
    if (!rows || rows.length < 2) {
      console.error("Not enough rows in the table");
      return [];
    }

    const headers = rows[0].map((cell: any) => cell.components?.[0]?.label || "");

    let companyName = "";
    let productName = "";
    if (this.templateData?.cCompanyName) {
      companyName = `Company name: ${this.templateData?.cCompanyName || ""}`;
      productName = `Product name: ${this.templateData?.cProductName || ""}`;
    } else {
      companyName = `Task name: ${this.templateData?.task_details?.cTaskName || ""}`;
      productName = `Description: ${this.templateData?.task_details?.cTaskDescription || ""}`;
    }

    const processedData = rows.slice(1).map((row: any[], _rowIndex: number) => {
      const obj: any = {};

      headers.forEach((header: string, colIndex: number) => {
        const comp = row[colIndex]?.components?.[0];

        if (!comp) {
          obj[header] = "";
          return;
        }

        const label = comp.label || "";
        let defaultValue = comp.defaultValue;
        // 🔹 Handle portal_action select mapping
        if (comp.key.startsWith("portal_action_")) {
          const matchedOption = comp?.data?.values?.find(
            (val: any) => val?.value === defaultValue
          );
          defaultValue = matchedOption?.label || "";
        }

        // Last column special handling
        if (colIndex === headers.length - 1) {
          const lastColKeyValue = comp.key || "";
          const matchingComments = this.templateData?.transition_comments?.filter(
            (comment: any) =>
              comment.type === formData.type &&
              comment.key === lastColKeyValue
          ) || [];

          if (matchingComments.length) {
            obj[header] = matchingComments
              .map((c: { cCreatedBy: any; cComment: any; cCreatedAt: string }) => {
                const formattedDate = moment(c.cCreatedAt).format(this.defDateFormat)
                return `• ${formattedDate} | ${c.cCreatedBy} | ${c.cComment}`;
              })
              .join(" | ");
          } else {
            obj[header] = "";
          }
          return;
        }

        if (label === "Select" || comp.type === "select") {
          obj[header] = Array.isArray(defaultValue)
            ? defaultValue.join(", ")
            : defaultValue || "";
        }  // Format date
        else if (comp.type === 'datetime' && defaultValue && !isNaN(Date.parse(defaultValue))) {
          obj[header] = defaultValue ? moment(defaultValue).format(this.defDateFormat) : "";
        } else if (comp.type === 'datetime') {
          obj[header] = "";
        } else if (label === "" || label === "Text Field") {
          obj[header] = defaultValue ?? "";
        } else {
          obj[header] = label;
        }
      });

      // obj["ID"] = rowIndex + 1;
      return obj;
    });

    const firstRowObj: any = {};
    headers.forEach((header: string | number, idx: number) => {
      if (idx === 1) {
        firstRowObj[header] = companyName;
      } else if (idx === 2) {
        firstRowObj[header] = productName;
      } else {
        firstRowObj[header] = "";
      }
    });
    firstRowObj["ID"] = "";

    return [firstRowObj, ...processedData];
  }

  async getExportContext() {
    if (!this.showPhasesTransition) {
      await this.loadTemplatMapping();
    } else {
      await this.handleTransitionId(this.templateId);
    }
    // console.log("await this.processData(this.formData)", await this.processData(this.formData));
    return {
      formData: await this.processData(this.formData),
      isExporting: this.isExporting,
      htmlSection: this.htmlSection ?? null,
      filename: "Transition_Checklist(Phases)"
    };
  }
  triggerExport(exportType: string) {
    this.transitionService.triggerExport(exportType);
  }

}
