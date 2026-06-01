import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Input, Renderer2, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { Select } from 'primeng/select';
import { AgGridDataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component';
import { CategoriesService } from 'projects/customer-management-ui/shared/categories/categories.service';
import { TransitionService } from 'projects/customer-management-ui/shared/transition/transition.service';
import { firstValueFrom } from 'rxjs';
const transition = "transition";
import { BBLoaderService, BbStoreService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { CsatScoreComponent } from '../csat/csat-score/csat-score.component';
import { CsatSurveyComponent } from '../csat/csat-survey/csat-survey.component';
import { DynamicHeightDirective } from '../../sharedUI/directives/dynamic-height.directive';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
// import { Dialog } from 'primeng/dialog';
import { DialogModule } from 'primeng/dialog';
import moment from 'moment';
import { TextareaModule } from 'primeng/textarea';
import { AgGridDynamicHeightDirective } from '../../sharedUI/directives/ag-grid-header-height/ag-grid-dynamic-height.directive';
import { PAGE_SIZE_SELECTOR } from "../../sharedUI/constants/pagination-list.service"
import { GridOptions } from 'ag-grid-community';
import { MenuTransitionComponent } from "../../sharedUI/menu-transition/menu-transition.component";
import { initializeControls } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/controls/control';
import { ExcelService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service';
@Component({
  selector: 'app-transition-dashboard',
  imports: [
    AgGridDynamicHeightDirective,
    TooltipModule,
    FloatLabelModule,
    TextareaModule,
    CommonModule,
    NgMultiSelectDropDownModule,
    FormsModule,
    NgbModule,
    IconFieldModule,
    ButtonModule,
    CommonModule,
    InputIconModule,
    InputTextModule,
    CsatScoreComponent,
    CsatSurveyComponent,
    Select,
    AgGridDataTableComponent, DynamicHeightDirective,
    ReactiveFormsModule, DialogModule,
    MenuModule
  ],
  templateUrl: './transition-dashboard.component.html',
  styleUrl: './transition-dashboard.component.scss'
})
export class TransitionDashboardComponent {
  private router = inject(Router);
  private transitionService = inject(TransitionService);
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  private cdRef = inject(ChangeDetectorRef);
  private categoryService = inject(CategoriesService);
  private bbToaster = inject(BBToastService);
  private BbStoreService = inject(BbStoreService);
  private bbLoader = inject(BBLoaderService);
  private fb = inject(FormBuilder);
  private modalService = inject(NgbModal);
  private excelService = inject(ExcelService);

  filterForm!: FormGroup;
  confirmForm!: FormGroup;
  @Input() EditData: any;
  OpportunityTransition: any;
  filteredOpportunityTransitionData: any[] = [];
  opportunitySearchText: string = '';
  opportunityGridOptions: any = {};
  opportunityGridApi: any = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {

    // Initialize forms in constructor
    this.confirmForm = this.fb.group({
      reason: ['']
    });

    this.filterForm = this.fb.group({
      opportunity: ['0'],
      users: ['0'],
      status: ['0'],
      account: ['0'],
    });
  }
  public gridOptions: GridOptions = {
    onGridReady: (params) => this.onGridReady(params),
    onFirstDataRendered: () => {
      this.applyAllControlPermissions();
    },
    onRowDataUpdated: () => {
      this.applyAllControlPermissions();
    },
    onFilterChanged: (event: any) => this.onGridFilterChanged(event),
    popupParent: document.body,
  };
  gridApi: any;
  dataLoaded: boolean = false;
  gridReady: boolean = false;
  selectedFilters = {};
  @ViewChild("unsavedChgmodal") unsavedChgModal: any;
  @ViewChild("unsavedChgmodalTransionComplete") unsavedChgmodalTransionComplete: any;
  page = 1;
  actionText: any = '';
  opportunityList: any = [{ cOpportunityName: "All", _id: "0" }];
  usersList: any = [{ loginName: "All", _id: "0" }];
  accountList: any = [{ accountName: "All", _id: "0" }];
  statusList: any = [{ statusName: "All", _id: "0" }];
  selectedViewCard: any = "tableViewContent";
  isTableView: any;
  searchText: any;
  pageSize = 50;
  totalRecords = 0;
  fontSize: any;
  transitionId: any;
  AllOpportunityCount: number = 0;
  statusSubStatusCounts: any;
  datafetching: any;
  themeClass: any;
  listItemsColumnData: any = [];
  listItems: any = [];
  listItemsTable: any = [];
  statuses: any;
  commonClass: any;
  statusCounts: any;
  transitionDetails: any;
  status!: string[];
  statusSubStatusesMap: { [status: string]: any[] } = {};
  statusIconsMap: { [status: string]: any } = {};
  statusClass: { [status: string]: string } = {};
  statusElement: { [status: string]: string } = {};
  statusBorder: { [status: string]: string } = {};
  statusColors: { [status: string]: string } = {};
  rawData: any = [];
  originalData: any;
  table: any = [];
  originaltable: any = [];
  position = "last";
  transitionModel: boolean = false;
  successForm: boolean = false;
  transitionData: any;
  excelItems: MenuItem[] = [
    { label: "Export Excel", icon: "bi bi-filetype-exe text-xl", command: () => this.onExport("EXCEL") },
    { label: "Export CSV", icon: "bi bi-filetype-csv text-xl", command: () => this.onExport("CSV") },
    // { label: "Export PDF", icon: "pi pi-file-pdf", command: () => this.onExport("PDF") },
  ];
  selectedView = { name: 'My List', code: 'My List' };
  listView: any = [{ name: 'All List', code: 'All List' }, { name: 'My List', code: 'My List' },]
  editopportunityPage: { id: any; isEdited: boolean; } | undefined;
  commentEditData: any;
  selectedStatus: any = 'all';
  commentDetail: any;
  users: any = [];
  selectedCompanyName: any;
  defTimeZone: string = "Asia/Kolkata";
  showCardsItems: boolean[] = [];
  showcsatSurvey: boolean = false;
  surveyMappedId: any;
  showcsatScore: boolean = false;
  subClassList: any = [];
  paginationPageSizeSelector = PAGE_SIZE_SELECTOR;

  applyAllControlPermissions() {
    // console.log("Applying permissions...");

    const savedControls = this.BbStoreService.getItem("mastercontrols");
    // console.log("savecontrol=>", savedControls);

    const item = this.BbStoreService.getItem("controls");
    // console.log("item=>", item)
    if (savedControls && item) {
      const controls = JSON.parse(savedControls);
      const actionData = JSON.parse(item);

      setTimeout(() => {
        initializeControls(controls, actionData, "id", new FormGroup({}));
        initializeControls(controls, actionData, "class", new FormGroup({}));
      });
    }
  }

  onGridFilterChanged(event: any) {
    // Check if this is a real filter change event from AG Grid
    if (event && event.api) {
      const filterModel = event.api.getFilterModel();
      this.selectedFilters = filterModel;

      // Save filters to localStorage
      this.safeSetTransitionData({ "transitionTableFilter": JSON.stringify(filterModel) });
      // console.log("Saved Filter Model:", filterModel);
    }
  }
  defDateFormat: any;
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
  async ngOnInit() {
    await this.loadUsers();
    await this.loadStatuses();
    this.defTimeZone = this.BbStoreService.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.mapToBsDateFormat(this.BbStoreService.getItem("dateFormatkey") || 'mm/dd/yyyy');
    this.selectedViewCard = this.BbStoreService.getItem("cardView") ?? "tableViewContent";
    this.showcsatSurvey = false;
    this.showcsatScore = false;
    this.subClassList = [];
    try {
      this.bbLoader.showLoader();
      await Promise.all([
        this.loadExistingTransition(),
      ]);

    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.bbLoader.hideLoader();
      await this.loadInitial();
    }
    this.cdRef.detectChanges();
    setTimeout(async () => {
      if (this.gridReady && this.gridApi) {
        await this.restoreGridFilters();
        this.cdRef.detectChanges();
      }
    }, 100)
  }

  ngOnChanges() {
    this.EditData = this.EditData ?? {};
    console.log(' this.EditData: ', this.EditData);
  }

  async loadInitial() {
    try {
      const transitionData = this.safeGetTransitionData();
      const fetchLocal = transitionData ? transitionData : null;
      if (fetchLocal?.filterForm) {
        this.filterForm.patchValue({
          account: fetchLocal.filterForm.account ?? '0',
          opportunity: fetchLocal.filterForm.opportunity ?? '0',
          status: fetchLocal.filterForm.status ?? '0',
          users: fetchLocal.filterForm.users ?? '0'
        });
      }
      if (fetchLocal?.selectedView || this.selectedView) {
        this.selectedView = fetchLocal?.selectedView ?? { name: 'My List', code: 'My List' };
        await this.onChangeView({
          value: {
            name: this.selectedView.name
          }
        });
      }

      if (fetchLocal?.searchText) {
        await this.onSearchInput({ target: { value: fetchLocal?.searchText } });
      }
      this.selectedViewCard = this.BbStoreService.getItem("cardView") ?? "tableViewContent";

    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.users = await this.categoryService.getUsers();
      // Sort alphabetically by name
      this.users.sort((a: { loginName: string }, b: { loginName: string }) =>
        a.loginName.localeCompare(b.loginName)
      );

    } catch { }
  }
  async loadStatuses(): Promise<void> {
    try {
      // this.bbLoader.showLoader();
      this.statuses = await this.categoryService.getCardStatuses("Transition");
      console.log("statuses", this.statuses);
      const statusesSet = new Set<string>();
      this.statusSubStatusesMap = this.statuses.reduce(
        (map: { [x: string]: any; }, status: { cStatus_Name: string; subStatuses: never[]; }) => {
          const key = status.cStatus_Name?.toLowerCase();
          map[key] = status.subStatuses || [];
          return map;
        },
        {} as { [status: string]: any[] }
      );

      this.statuses?.forEach((status: { cStatus_Name: string; }) => {
        if (status.cStatus_Name) {
          statusesSet.add(status.cStatus_Name);
        }
      });
      this.status = Array.from(statusesSet);
      this.statusIconsMap = this.statuses.reduce(
        (map: { [x: string]: any; }, status: { cStatus_Name: string; statusIcons: any; }) => {
          const statusNameLowerCase = status.cStatus_Name?.toLowerCase();
          map[statusNameLowerCase] = status.statusIcons;
          return map;
        },
        {} as { [status: string]: string }
      );
      console.log('  this.statusIconsMap : ', this.statusIconsMap);
      this.statusClass = this.statuses.reduce(
        (map: { [x: string]: string; }, status: { cStatus_Name: string; className: any; }) => {
          const statusNameLowerCase = status.cStatus_Name?.toLowerCase();
          map[statusNameLowerCase] = `${this.commonClass} ${status.className}`;
          return map;
        },
        {} as { [status: string]: string }
      );
      this.statusElement = this.statuses.reduce(
        (map: { [x: string]: any; }, status: { cStatus_Name: string; className: any; }) => {
          const statusNameLowerCase = status.cStatus_Name?.toLowerCase();
          map[statusNameLowerCase] = status.className;
          return map;
        },
        {} as { [status: string]: string }
      );
      this.statusBorder = this.statuses.reduce(
        (map: { [x: string]: any; }, status: { cStatus_Name: string; borderColor: any; }) => {
          const statusNameLowerCase = status.cStatus_Name?.toLowerCase();
          map[statusNameLowerCase] = status.borderColor;
          return map;
        },
        {} as { [status: string]: string }
      );
      console.log(' this.statusBorder: ', this.statusBorder);
      this.statusColors = this.statuses.reduce(
        (map: { [x: string]: any; }, status: { cStatus_Name: string; borderColor: any; }) => {
          const statusNameLowerCase = status.cStatus_Name?.toLowerCase();
          map[statusNameLowerCase] = status.borderColor;
          return map;
        },
        {} as { [status: string]: string }
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      // this.bbLoader.hideLoader();
    }
  }

  opportunityTransitionData: any = null;
  showOpportunityTransition: boolean = false;

  onOpportunityGridReady(params: any) {
    this.opportunityGridApi = params.api;
    // Auto-size columns
    params.api.sizeColumnsToFit();
  }

  async loadExistingTransition() {
    try {
      const transition: any = await firstValueFrom(this.transitionService.loadExistingTransition());

      if (this.EditData?.id) {
        this.showOpportunityTransition = true;
        const opportunityTransition = await firstValueFrom(
          this.transitionService.getTransitionByOpportunityId(this.EditData.id)
        );

        if (opportunityTransition?.data && opportunityTransition.data !== null) {
          this.opportunityTransitionData = opportunityTransition.data;
          this.formatOpportunityTransitionData();
          // Initialize filtered data
          this.filteredOpportunityTransitionData = Array.isArray(this.opportunityTransitionData)
            ? this.opportunityTransitionData
            : [this.opportunityTransitionData];
        } else {
          this.showOpportunityTransition = false;
          this.opportunityTransitionData = null;
          this.filteredOpportunityTransitionData = [];
        }
      }

      console.log('transition: ', transition);
      this.rawData = transition?.data ?? [];
      const filteredData = this.rawData.map((item: any) => {
        const findUser = this.users?.find((user: any) => user._id === item.transition_manager_id);
        const score = this.calculateProductCSAT(item);
        const rounded = Math.round(score);

        const cUpdatedBy = this.users?.find((user: any) => user._id === item.cUpdatedBy);
        const cCreatedBy = this.users?.find((user: any) => user._id === item.cCreatedBy);
        return {
          ...item,
          ['Products']: [
            ...new Map(
              (item?.products ?? [])
                .filter((p: { cFeaturesDesc: any; }) => p?.cFeaturesDesc)
                .map((p: { cFeaturesDesc: string; }) => [p.cFeaturesDesc.toLowerCase(), p.cFeaturesDesc])
            ).values()
          ].join(", "),
          ["Opportunity Name"]: item?.opportunityName,
          Subclass: [
            ...new Map(
              (item?.products ?? [])
                .filter((p: { subClassName: any; }) => p?.subClassName)
                .map((p: { subClassName: string; }) => [p.subClassName.toLowerCase(), p.subClassName])
            ).values()
          ].join(", "),
          ['Transition ID']: item?.transitionNo,
          ['Transition Name']: item?.cTransition_Name,
          ['Account Name']: item?.accountName,
          AccountName: item?.accountName,
          cOpportunityName: item?.opportunityName,
          productName: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
          cate_className: item?.products?.map((val: any) => val.categoryName).join(", "),
          subClassName: item?.products?.map((val: any) => val.subClassName).join(", "),
          transitionStatus: item?.transitionStatus,
          ['Transition Status']: item?.transitionStatus,
          ['Transition Manager']: findUser?.empName,
          ['Overall Compliance %( Toll gate )']: item?.originaloverallscore ? `${Math.round(item?.originaloverallscore)}%` : "",
          ["Created by"]: cCreatedBy?.empName,
          ["Created Date"]: moment(item?.dCreatedAt).format(this.defDateFormat.toUpperCase()),
          ["Updated By"]: cUpdatedBy?.empName,
          ["Last Updated Date"]: !item?.dUpdatedAt ? null : moment(item?.dUpdatedAt).format(this.defDateFormat.toUpperCase()),
          ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
          ['Template Name']: item?.mappedProcess,
          userDetails: findUser
          // _id: {
          //   _id: item["_id"],
          // },
        };
      });

      this.listItems = filteredData?.filter((item: any) => item["transition_manager_id"] === this.BbStoreService.getItem("userId"));
      this.datafetching = this.listItems?.length > 0;
      this.table = this.listItems;
      this.originaltable = this.listItems;

      this.listItemsColumnData = [
        {
          headerName: "Transition ID",
          field: "Transition ID",
          sortable: true,
          filter: "checkboxSearchFilter",
          cellRenderer: (params: any) => {
            return `
          <span
            class="rowlink-click text-blue-500 underline cursor-pointer"
            data-action="open"
            title="View Transition"
          >
          ${params.value}
          </span>`;
          },
          // | ${moment(params?.data?.dCreatedAt).format('MM-YYYY')}
          onCellClicked: (params: any) => {
            if (params.event?.target?.dataset?.action === "open") {
              // if (params?.data?.isNew) {
              //   this.unsavedmodal(this.unsavedChgModal, params?.data);
              // } else {
              this.ViewTranstion(params?.data);
              // }
            }
          },
        },
        {
          headerName: "Transition Name",
          field: "Transition Name",
          sortable: true,
          filter: "checkboxSearchFilter",
          cellRenderer: (params: any) => {
            return `
            <span class="rowlink-click text-blue-500 underline cursor-pointer" data-action="open">
              ${params.value}
            </span>
          `;
          },
          onCellClicked: (params: any) => {
            if (params.event?.target?.dataset?.action === "open") {
              // console.log("params?.data: ", params?.data);
              // if (params?.data?.isNew) {
              //   this.unsavedmodal(this.unsavedChgModal, params?.data);
              // } else {
              this.ViewTranstion(params?.data);
              // }
            }
          },
        },
        {
          headerName: "Account Name",
          field: "Account Name",
          sortable: true,
          filter: "checkboxSearchFilter",
          // cellRenderer: (params: any) => {
          //   return `
          //       <span class="rowlink-click text-blue-500 underline cursor-pointer" data-action="open">
          //         ${params.value}
          //       </span>
          //     `;
          // },
          // onCellClicked: (params: any) => {
          //   if (params.event?.target?.dataset?.action === "open") {
          //     console.log("params?.data: ", params?.data);
          //     if (params?.data?.isNew) {
          //       this.unsavedmodal(this.unsavedChgModal, params?.data);
          //     } else {
          //       this.ViewTranstion(params?.data);
          //     }
          //   }
          // },
        },
        {
          headerName: "Template Name",
          field: "Template Name",
          sortable: true,
          filter: "checkboxSearchFilter",
        },
        {
          headerName: "Opportunity Name",
          field: "Opportunity Name",
          sortable: true,
          filter: "checkboxSearchFilter",
        },
        {
          headerName: "Subclass",
          field: "Subclass",
          sortable: true,
          filter: "checkboxSearchFilter",
        },
        {
          headerName: "Products",
          field: "Products",
          sortable: true,
          filter: "checkboxSearchFilter",
        },
        {
          headerName: "Transition Manager",
          field: "Transition Manager",
          sortable: true,
          filter: "checkboxSearchFilter",
        },
        {
          headerName: "Overall Compliance %( Toll gate )",
          field: "Overall Compliance %( Toll gate )",
          sortable: true,
          filter: "checkboxSearchFilter",
        },
        // {
        //   headerName: "Created by",
        //   field: "Created by",
        //   sortable: true,
        //   filter: "checkboxSearchFilter",
        // },
        // {
        //   headerName: "Created Date",
        //   field: "Created Date",
        //   sortable: true,
        //   filter: "checkboxSearchFilter",
        // },
        // {
        //   headerName: "Updated By",
        //   field: "Updated By",
        //   sortable: true,
        //   filter: "checkboxSearchFilter",
        // },
        // {
        //   headerName: "Last Updated Date",
        //   field: "Last Updated Date",
        //   sortable: true,
        //   filter: "checkboxSearchFilter",
        // },
        {
          headerName: "Transition Status",
          field: "Transition Status",
          sortable: true,
          filter: "checkboxSearchFilter",
          cellRenderer: (params: any) => {
            return `<span class="${params?.data?.transitionClassName}">${params?.data?.currentApprovalLog?.comment ? `${params?.data?.transitionStatus} - ${params?.data?.currentApprovalLog?.comment}` : params?.data?.transitionStatus ?? ""}</span>`;
          },
        },
        {
          headerName: "CSAT %",
          field: "CSAT %",
          sortable: true,
          filter: "checkboxSearchFilter",
          cellRenderer: (params: any) => {
            return `
            <span class="rowlink-click text-blue-500 underline cursor-pointer" data-action="open">
              ${params.value}
            </span>
          `;
          },
          onCellClicked: (params: any) => {
            if (params.event?.target?.dataset?.action === "open") {
              this.csatScore(params?.data?.surveyMappedId);
            }
          },
        },
        {
          headerName: "Actions",
          field: "actions",
          cellRenderer: MenuTransitionComponent,
          cellRendererParams: {
            context: {
              componentParent: this,
            },
          },
          suppressMenu: true,
          sortable: false,
          filter: false,
          minWidth: 250,
        },
      ];
      await this.onSetfilterValues();
      await this.GetFilterCounts();
      this.totalRecords = this.rawData?.length;
    } catch (error) {
      console.log('error: ', error);

    }
  }

  formatOpportunityTransitionData() {
    if (!this.opportunityTransitionData) return;

    // If data is an array, process each item
    const dataToProcess = Array.isArray(this.opportunityTransitionData)
      ? this.opportunityTransitionData
      : [this.opportunityTransitionData];

    this.opportunityTransitionData = dataToProcess.map((item: any) => {
      const findUser = this.users?.find((user: any) => user._id === item.transition_manager_id);

      return {
        ...item,
        ['Transition ID']: item?.transitionNo,
        ['Transition Name']: item?.cTransition_Name,
        ['Account Name']: item?.accountName,
        ['Template Name']: item?.mappedProcess,
        ['Opportunity Name']: item?.opportunityName,
        ['Subclass']: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { subClassName: any; }) => p?.subClassName)
              .map((p: { subClassName: string; }) => [p.subClassName.toLowerCase(), p.subClassName])
          ).values()
        ].join(", "),
        ['Products']: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { cFeaturesDesc: any; }) => p?.cFeaturesDesc)
              .map((p: { cFeaturesDesc: string; }) => [p.cFeaturesDesc.toLowerCase(), p.cFeaturesDesc])
          ).values()
        ].join(", "),
        ['Transition Manager']: findUser?.empName,
        _id: item._id,
        transition_completed: item.transition_completed,
        transitionStatusId: item.transitionStatusId,
        transitionClassName: item.transitionClassName,
        isNew: item.isNew,
        isSurvey: item.isSurvey,
        surveyMappedId: item.surveyMappedId
      };
    });
  }

  opportunityTransitionColumns = [
    {
      headerName: "Transition ID",
      field: "Transition ID",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellRenderer: (params: any) => {
        return `
        <span
          class="rowlink-click text-blue-500 underline cursor-pointer"
          data-action="open"
          title="View Transition"
        >
        ${params.value}
        </span>`;
      },
      onCellClicked: (params: any) => {
        if (params.event?.target?.dataset?.action === "open") {
          this.ViewTranstion(params?.data);
        }
      },
    },
    {
      headerName: "Transition Name",
      field: "Transition Name",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellRenderer: (params: any) => {
        return `
        <span class="rowlink-click text-blue-500 underline cursor-pointer" data-action="open">
          ${params.value}
        </span>`;
      },
      onCellClicked: (params: any) => {
        if (params.event?.target?.dataset?.action === "open") {
          this.ViewTranstion(params?.data);
        }
      },
    },
    {
      headerName: "Account Name",
      field: "Account Name",
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
      headerName: "Opportunity Name",
      field: "Opportunity Name",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Subclass",
      field: "Subclass",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Products",
      field: "Products",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Transition Manager",
      field: "Transition Manager",
      sortable: true,
      filter: "checkboxSearchFilter",
    }
  ];

  async GetFilterCounts() {
    this.statusCounts = {};
    this.statusSubStatusCounts = {};
    this.originaltable?.forEach((item: any) => {

      if (!item?.transitionStatus || typeof item.transitionStatus !== "string") {
        return; // Skip invalid status
      }

      // const parts = item.Status.split(" -");
      const statusRaw = item.transitionStatus;

      const status = statusRaw?.trim()?.toLowerCase();
      if (status) {
        this.statusCounts[status] = (this.statusCounts[status] || 0) + 1;
      }
    });

    this.AllOpportunityCount = this.originaltable?.length;
    this.cdRef.detectChanges();
  }

  cardToggle(index: number): void {
    this.showCardsItems[index] = !this.showCardsItems[index];
  }

  async onSearch(event: string) {
    this.BbStoreService.setItem("selectedStatus", event);
    this.safeSetTransitionData({
      selectedStatus: event
    });
    const allList = this.element.nativeElement.querySelector(".borderActive-all");

    const resetStyles = () => {
      Object.entries(this.statusElement)?.forEach(([_statusDescription, className]) => {
        const element = this.element.nativeElement.querySelector(`.${className}`);
        this.renderer.setStyle(allList, "border", "unset");

        if (element) {
          this.renderer.setStyle(element, "border", "unset");
        }
      });
    };
    const statusNameLowerCase = event?.toLowerCase();
    if (statusNameLowerCase === "all") {
      resetStyles();
      this.renderer.setStyle(allList, "border", `1px solid var(--ab-primary)`);
      this.listItems = this.originaltable;
      this.table = this.originaltable;
    } else {
      const className = this.statusElement[statusNameLowerCase] || "";
      const borderColor = this.statusBorder[statusNameLowerCase] || "unset";

      resetStyles();

      const targetElement = this.element.nativeElement.querySelector(`.${className}`);

      if (targetElement) {
        this.renderer.setStyle(targetElement, "border", `1px solid ${borderColor}`);
        if (className) {
          className.split(" ")?.forEach((cls: string) => this.renderer.addClass(targetElement, cls));
        }

        this.listItems = this.originaltable?.filter((item: any) => {
          const baseStatus = item?.transitionStatus;
          const baseStatusLower = typeof baseStatus === "string" ? baseStatus?.toLowerCase() : "";
          return baseStatusLower === statusNameLowerCase;
        });
        this.table = this.listItems;
      } else {
        this.listItems = this.table;
        resetStyles();
      }
    }
    this.page = 1;
    this.totalRecords = this.listItems?.length;
  }
  getBackgroundColor(status: string): string {
    const statusKey = status?.toLowerCase();
    const borderColor = this.statusBorder[statusKey] || "#E7EAEB";
    return this.lightenColor(borderColor, 0.9);
  }
  lightenColor(hex: string, percent: number): string {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Lighten each color component
    r = Math.min(255, Math.floor(r + (255 - r) * percent));
    g = Math.min(255, Math.floor(g + (255 - g) * percent));
    b = Math.min(255, Math.floor(b + (255 - b) * percent));

    // Convert RGB back to hex
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  getIconColor(status: string): string {
    const statusKey = status?.toLowerCase();
    const borderColor = this.statusBorder[statusKey] || "#E7EAEB";
    return borderColor;
  }

  onSubStatusSearch(status: string, sub: string, index: any): void {
    const statusName = status?.trim()?.toLowerCase();
    const subStatusName = sub?.trim()?.toLowerCase();

    if (!statusName || !subStatusName) {
      console.warn("Invalid status or substatus", status, sub);
      return;
    }

    this.listItems = this.table?.filter((item: any) => {
      // pull the raw Status and SubStatus off the _id object:
      const itemStatus = item?.transitionStatus?.toLowerCase() || "";

      // now do a straight equality on the two pieces
      return itemStatus === statusName;
    });
    this.showCardsItems[index] = false;
    this.cdRef.detectChanges();
  }

  async onExport(exportType: string) {
    let fileName = "Transition Management List";
    const displayedRows: any[] = [];
    this.gridApi.forEachNodeAfterFilterAndSort((node: { data: any; }) => {
      displayedRows.push(node.data);
    });
    const exportData = displayedRows?.map((item: any) => {
      const findUser = this.users?.find((user: any) => user._id === item.transition_manager_id);
      const score = this.calculateProductCSAT(item);
      const rounded = Math.round(score);
      const cUpdatedBy = this.users?.find((user: any) => user._id === item.cUpdatedBy);
      const cCreatedBy = this.users?.find((user: any) => user._id === item.cCreatedBy);
      return {
        ['Transition ID']: item?.transitionNo,
        ['Transition Name']: item?.cTransition_Name,
        ["Account Name"]: item?.accountName,
        ['Template Name']: item?.mappedProcess,
        ["Opportunity Name"]: item?.opportunityName,
        Subclass: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { subClassName: any; }) => p?.subClassName)
              .map((p: { subClassName: string; }) => [p.subClassName.toLowerCase(), p.subClassName])
          ).values()
        ].join(", "),
        ['Products']: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { cFeaturesDesc: any; }) => p?.cFeaturesDesc)
              .map((p: { cFeaturesDesc: string; }) => [p.cFeaturesDesc.toLowerCase(), p.cFeaturesDesc])
          ).values()
        ].join(", "),
        ['Transition Manager']: findUser?.empName,
        ['Overall Compliance %( Toll gate )']: item?.originaloverallscore ? `${Math.round(item?.originaloverallscore)}%` : "",
        ["Created by"]: cCreatedBy?.empName,
        ["Created Date"]: moment(item?.dCreatedAt).format(this.defDateFormat.toUpperCase()),
        ["Updated By"]: cUpdatedBy?.empName,
        ["Last Updated Date"]: !item?.dUpdatedAt ? null : moment(item?.dUpdatedAt).format(this.defDateFormat.toUpperCase()),
        ['Transition Status']: item?.transitionStatus,
        ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
      };
    });
    /* ---------------- EXPORT ---------------- */
    if (exportType === "EXCEL") {
      this.excelService.ExportTOExcelWithImage(exportData, fileName);
    } else if (exportType === "PDF") {
      this.excelService.exportToPdf(exportData, fileName);
    } else if (exportType === "CSV") {
      this.excelService.exportToCsv(exportData, fileName);
    }
  }
  ViewTranstion(_id: any) {
    console.log('_id: ', _id);
    this.router.navigate([`/${transition}/view-transition`], { state: { _id: _id?._id, transition_completed: _id?.transition_completed, data: _id } });
  }

  classNames(transition: any) {
    const uniqueClass = new Set<string>();

    transition.products?.forEach((val: any) => {
      if (val.categoryName) {
        uniqueClass.add(val.categoryName);
      }
    });

    return Array.from(uniqueClass).join(", ");
  }
  subClassNames(transition: any) {
    const uniqueSubClasses = new Set<string>();

    transition.products?.forEach((val: any) => {
      if (val.subClassName) {
        uniqueSubClasses.add(val.subClassName);
      }
    });

    return Array.from(uniqueSubClasses).join(", ");
  }

  productNames(transition: any) {
    const uniqueNames = new Set<string>();

    transition.products?.forEach((prod: any) => {
      uniqueNames.add(prod.cFeaturesDesc);
    });

    return Array.from(uniqueNames).join(", ");
  }

  async csatSurvey(productId: any, transitionId: any) {
    this.subClassList = [];
    const response = await firstValueFrom(this.transitionService.checkTransitionComplete(transitionId));
    this.transitionId = { transitionId, productId, isTransitionManagement: true };
    if (response?.data?.isTranstion) {
      const uniqueSubClass = new Set();
      this.listItems?.forEach((val: any) => {
        // Check for matching transitionId
        if (val._id === transitionId) {
          val.products?.forEach((item: any) => {
            if (item.subClassName) {
              // Create a unique key using both subClassName and subClassId to ensure no duplicates
              const uniqueKey = item.subClassId;

              if (!uniqueSubClass.has(uniqueKey)) {
                uniqueSubClass.add(uniqueKey);
                this.subClassList.push({
                  subClassName: item.subClassName,
                  _id: item.subClassId // Assuming subClassId is the unique ID for this subClass
                });
              }
            }
          });
        }
      });

      this.subClassList = this.subClassList.sort((a: any, b: any) =>
        (a?.subClassName || '').localeCompare(
          b?.subClassName || '',
          undefined,
          { sensitivity: 'base' }
        )
      );

      this.showcsatSurvey = true;
    } else {
      this.bbToaster.show_warn("Please complete the transition before proceeding");
    }
  }

  csatScore(surveyMappedId: any) {
    this.surveyMappedId = surveyMappedId;
    this.showcsatScore = true;
  }

  calculateProductCSAT(product: any): number {
    // surveyResponse is Array<Array<userResponse>>
    const surveyGroups = product?.surveyResponse;
    if (!Array.isArray(surveyGroups) || surveyGroups.length === 0) return 0;

    // Flatten all survey responses
    const allResponses = surveyGroups.flat();

    // Consider only submitted responses with data
    const submittedResponses = allResponses.filter(
      (r: any) => r.isSubmitted && r.response
    );

    if (submittedResponses.length === 0) return 0;

    const totalUsers = submittedResponses.length;
    const userWeight = 100 / totalUsers;
    let productEarnedPercentage = 0;

    submittedResponses.forEach((userResponse: any) => {
      let userScore = 0;
      let userPossible = 0;

      for (let i = 5; i <= 11; i++) {
        const rating = userResponse.response[`survey_rating_${i}`];

        if (
          rating === "N/A" ||
          rating === null ||
          rating === undefined ||
          isNaN(Number(rating))
        ) {
          continue;
        }

        userScore += Number(rating);
        userPossible += 5;
      }

      if (userPossible > 0) {
        const userPercent = (userScore / userPossible) * 100;
        productEarnedPercentage += (userWeight * userPercent) / 100;
      }
    });

    return Math.round(productEarnedPercentage);
  }

  getProductCSATDisplay(product: any) {
    const score = this.calculateProductCSAT(product);
    const rounded = Math.round(score);

    if (rounded >= 80) {
      return {
        icon: "happy",
        text: `CSAT ${rounded}%`,
        className: "high-csat",
      };
    } else if (rounded >= 16) {
      return {
        icon: "neutral",
        text: `CSAT ${rounded}%`,
        className: "medium-csat",
      };
    } else {
      return {
        icon: "sad",
        text: `CSAT ${rounded}%`,
        className: "low-csat",
      };
    }
  }
  async onChangeComponent(_event: any) {
    await this.ngOnInit();
    this.showcsatSurvey = false;
  }

  async onChangeView(_event: any) {
    this.selectedView = {
      name: _event.value.name, code: _event.value.name
    }
    this.safeSetTransitionData({
      selectedView: this.selectedView
    });
    const filteredData = this.rawData.map((item: any) => {
      const findUser = this.users?.find((user: any) => user._id === item.transition_manager_id);
      const score = this.calculateProductCSAT(item);
      const rounded = Math.round(score);
      const cUpdatedBy = this.users?.find((user: any) => user._id === item.cUpdatedBy);
      const cCreatedBy = this.users?.find((user: any) => user._id === item.cCreatedBy);
      return {
        ...item,
        ['Products']: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { cFeaturesDesc: any; }) => p?.cFeaturesDesc)
              .map((p: { cFeaturesDesc: string; }) => [p.cFeaturesDesc.toLowerCase(), p.cFeaturesDesc])
          ).values()
        ].join(", "),
        ['Transition ID']: item?.transitionNo,
        ['Transition Name']: item?.cTransition_Name,
        ["Opportunity Name"]: item?.opportunityName,
        Subclass: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { subClassName: any; }) => p?.subClassName)
              .map((p: { subClassName: string; }) => [p.subClassName.toLowerCase(), p.subClassName])
          ).values()
        ].join(", "),
        ["Account Name"]: item?.accountName,
        AccountName: item?.accountName,
        cOpportunityName: item?.opportunityName,
        productName: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
        cate_className: item?.products?.map((val: any) => val.categoryName).join(", "),
        subClassName: item?.products?.map((val: any) => val.subClassName).join(", "),
        transitionStatus: item?.transitionStatus,
        ['Transition Status']: item?.transitionStatus,
        ['Transition Manager']: findUser?.empName,
        ['Overall Compliance %( Toll gate )']: item?.originaloverallscore ? `${Math.round(item?.originaloverallscore)}%` : "",
        ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
        ['Template Name']: item?.mappedProcess,
        ["Created by"]: cCreatedBy?.empName,
        ["Created Date"]: moment(item?.dCreatedAt).format(this.defDateFormat.toUpperCase()),
        ["Updated By"]: cUpdatedBy?.empName,
        ["Last Updated Date"]: !item?.dUpdatedAt ? null : moment(item?.dUpdatedAt).format(this.defDateFormat.toUpperCase()),
        userDetails: findUser
        // _id: {
        //   _id: item["_id"],
        // },
      };
    });
    if (_event.value.name === "My List") {
      this.listItems = filteredData?.filter((item: any) => item["transition_manager_id"] === this.BbStoreService.getItem("userId"));
      this.table = this.listItems;
      this.originaltable = this.listItems;
    } else {
      this.listItems = filteredData;
      this.table = filteredData;
      this.originaltable = filteredData;
    }
    await this.onSetfilterValues();
    const { opportunity, users, account } = this.filterForm.value;

    if (opportunity !== '0' || users !== '0' || account !== '0') {
      await this.applyAllFilters();
    }
    if (this.BbStoreService.getItem("selectedStatus")) {
      await this.onSearch(this.BbStoreService.getItem("selectedStatus"));
    }
    this.page = 1;
    this.totalRecords = this.listItems?.length;
    await this.GetFilterCounts();
  }

  async onSearchInput(event: any) {
    this.safeSetTransitionData({
      searchText: event.target.value
    });
    this.searchText = event;
    await this.applyAllFilters();
    await this.onSearch(this.BbStoreService.getItem("selectedStatus"));
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  // Call this whenever you need to refresh the visible list (on page or pageSize change)
  updateListItems() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.listItems = this.rawData.slice(start, end);
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.page = 1; // Reset to first page when page size changes
    this.updateListItems();
  }

  goToFirst() {
    if (this.page > 1) {
      this.page = 1;
      this.updateListItems();
    }
  }

  goToPrev() {
    if (this.page > 1) {
      this.page--;
      this.updateListItems();
    }
  }

  goToNext() {
    if (this.page < this.totalPages) {
      this.page++;
      this.updateListItems();
    }
  }

  goToLast() {
    if (this.page < this.totalPages) {
      this.page = this.totalPages;
      this.updateListItems();
    }
  }

  total() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }

  toggleContentView(selectedItem: any) {
    this.BbStoreService.setItem("cardView", selectedItem);
    this.selectedViewCard = selectedItem;
    if (this.selectedViewCard == "tableViewContent") {
      this.isTableView = true;
    } else {
      this.isTableView = false;
    }
  }

  handleTransitionAction(data: any, action: any) {
    this.actionText = action;
    console.log('data: ', data);

    this.transitionData = data;
    if (action === "initiate") {
      this.csatSurvey(data._id, data._id)
    } else if (action === "Complete") {
      this.confirmForm.reset();
      this.unsavedmodalComplete(this.unsavedChgmodalTransionComplete);
    }

  }
  unsavedmodalComplete(template: any) {
    this.modalService.open(template, { centered: true, size: 'lg', windowClass: 'custom-modal', backdrop: "static", keyboard: false });
  }

  async resetFilter() {
    this.filterForm = this.fb.group({
      opportunity: ["0"],
      users: ["0"],
      status: ["0"],
      account: ["0"],
    });
    this.listItems = this.rawData;
    this.page = 1;
    this.totalRecords = this.listItems?.length;
    // this.filterShow();
  }
  async setDataForm(value?: any, controlName?: string) {
    console.log('value------inital: ', value);
    if (controlName) {
      this.filterForm.patchValue({ [controlName]: value }, { emitEvent: false });
    }
    await this.applyAllFilters();
    this.onSearch("all")
  }

  async applyAllFilters() {
    const { opportunity, users, account } = this.filterForm.value;
    this.safeSetTransitionData({
      filterForm: this.filterForm.value
    });
    const searchText = this.searchText?.target?.value?.toLowerCase().trim() || '';
    let filteredData = this.rawData.map((item: any) => {
      const findUser = this.users?.find((user: any) => user._id === item.transition_manager_id)
      const score = this.calculateProductCSAT(item);
      const rounded = Math.round(score);
      const cUpdatedBy = this.users?.find((user: any) => user._id === item.cUpdatedBy);
      const cCreatedBy = this.users?.find((user: any) => user._id === item.cCreatedBy);
      return {
        ...item,
        ['Products']: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { cFeaturesDesc: any; }) => p?.cFeaturesDesc)
              .map((p: { cFeaturesDesc: string; }) => [p.cFeaturesDesc.toLowerCase(), p.cFeaturesDesc])
          ).values()
        ].join(", "),
        ['Transition ID']: item?.transitionNo,
        ['Transition Name']: item?.cTransition_Name,
        ["Opportunity Name"]: item?.opportunityName,
        Subclass: [
          ...new Map(
            (item?.products ?? [])
              .filter((p: { subClassName: any; }) => p?.subClassName)
              .map((p: { subClassName: string; }) => [p.subClassName.toLowerCase(), p.subClassName])
          ).values()
        ].join(", "),
        ["Account Name"]: item?.accountName,
        AccountName: item?.accountName,
        cOpportunityName: item?.opportunityName,
        productName: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
        cate_className: item?.products?.map((val: any) => val.categoryName).join(", "),
        subClassName: item?.products?.map((val: any) => val.subClassName).join(", "),
        transitionStatus: item?.transitionStatus,
        ['Transition Status']: item?.transitionStatus,
        ['Transition Manager']: findUser?.empName,
        ['Overall Compliance %( Toll gate )']: item?.originaloverallscore ? `${Math.round(item?.originaloverallscore)}%` : "",
        ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
        ['Template Name']: item?.mappedProcess,
        ["Created by"]: cCreatedBy?.empName,
        ["Created Date"]: moment(item?.dCreatedAt).format(this.defDateFormat.toUpperCase()),
        ["Updated By"]: cUpdatedBy?.empName,
        ["Last Updated Date"]: !item?.dUpdatedAt ? null : moment(item?.dUpdatedAt).format(this.defDateFormat.toUpperCase()),
        userDetails: findUser
        // _id: {
        //   _id: item["_id"],
        // },
      };
    });
    if (this.selectedView.name === 'My List') {
      filteredData = filteredData?.filter((item: any) => item["transition_manager_id"] === this.BbStoreService.getItem("userId"));
    }
    let data = [...filteredData]; // ✅ SOURCE OF TRUTH

    /* ---------- DROPDOWN FILTERS ---------- */
    data = data.filter(item => {
      const matchOpportunity =
        !opportunity || opportunity === '0' || item.opportunityId == opportunity;

      const matchUser =
        !users || users === '0' || item.transition_manager_id == users;

      const matchAccount =
        !account || account === '0' || item.AccountId == account;

      return matchOpportunity && matchUser && matchAccount;
    });

    /* ---------- SEARCH FILTER ---------- */
    if (searchText) {
      const searchFields = [
        'transitionNo',
        'AccountName',
        'cCompanyCode',
        'mappedProcess',
        'productName',
        'transitionStatus',
        'opportunityName',
        'cate_className',
        'subClassName',
        'Transition Manager',
        'Overall Compliance %( Toll gate )',
        'CSAT %'
      ];

      data = data.filter(item => {
        const check = (obj: any) =>
          searchFields.some(field =>
            obj[field]?.toString().toLowerCase().includes(searchText)
          );

        return (
          check(item) ||
          item.products?.some((p: any) => check(p)) ||
          item.surveyResponse?.flat()?.some((r: any) => check(r))
        );
      });
    }

    /* ---------- FINAL UI DATA ---------- */
    this.listItems = data;
    this.table = data;
    this.originaltable = data;
    this.page = 1;
    this.totalRecords = data.length;
    this.GetFilterCounts();
    this.cdRef.detectChanges();
  }

  async confirmNavigate(dismiss: any) {
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      this.bbToaster.show_warn('Please enter required fields')
      return;
    }
    try {
      const payload = {
        id: this.transitionDetails?._id ?? this.transitionData?._id,
        action:
          this.actionText === 'Change Template' ? 1 : this.actionText === 'Hold' ? 2 : this.actionText === 'Cancel' ? 3 : this.actionText === 'Complete' ? 4 : this.actionText === 'Reinitiate' ? 5 : 6,
        reason: this.confirmForm.value.reason !== '' ? this.confirmForm.value.reason : "Transition process started"
      };

      const response = await firstValueFrom(this.transitionService.actionTransitionProcess(payload));
      if (response.success) {
        await this.loadExistingTransition();
        this.bbToaster.show_success(response.message);
      } else {
        this.bbToaster.show_success(response.message);
      }
      dismiss(); // Close the modal

    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.BbStoreService.removeItem('selectedStatus');
      await this.applyAllFilters();
      await this.onSearch('all');
      this.cdRef.detectChanges();
    }
  }

  cancelModel(dismiss: any) {
    this.transitionDetails = null;
    this.confirmForm.reset();
    dismiss();
  }

  unsavedmodal(template: any, data: any) {
    this.actionText = '';
    this.transitionDetails = data;
    this.modalService.open(template, { centered: true, size: 'lg', backdrop: "static", keyboard: false });
  }

  removeSpace() {
    const ctrl = this.confirmForm.get('reason');
    if (!ctrl) return;

    const value = ctrl.value || '';

    // remove leading & trailing spaces only
    ctrl.setValue(value.trimStart(), { emitEvent: false });
  }

  productNamesList(transitionData: any) {
    return transitionData?.products?.map((val: any) => val.productName).join(', ')
  }
  async onSetfilterValues() {
    this.opportunityList = [{ cOpportunityName: "All", _id: "0" }];
    this.usersList = [{ loginName: "All", _id: "0" }];
    this.accountList = [{ accountName: "All", _id: "0" }];
    this.statusList = [{ statusName: "All", _id: "0" }];
    const uniqueOpportunities = new Set();
    // const uniqueStatuses = new Set();
    const uniqueAccounts = new Set();
    const uniqueUsers = new Set();
    this.listItems?.forEach((val: any) => {
      // For Opportunities
      if (val.cOpportunityName && !uniqueOpportunities.has(val.cOpportunityName)) {
        uniqueOpportunities.add(val.cOpportunityName);
        this.opportunityList.push({
          cOpportunityName: val.cOpportunityName,
          _id: val.opportunityId
        });
      }

      // // For Statuses
      // if (val.opportunityStatus && !uniqueStatuses.has(val.opportunityStatus)) {
      //   uniqueStatuses.add(val.opportunityStatus);
      //   this.statusList.push({
      //     statusName: val.opportunityStatus,
      //     _id: val.opportunityStatusId
      //   });
      // }

      // For Accounts
      if (val.accountName && !uniqueAccounts.has(val.accountName)) {
        uniqueAccounts.add(val.accountName);
        this.accountList.push({
          cCompanyCode: val.cCompanyCode,
          accountName: val.accountName,
          _id: val.AccountId
        });
      }

      // For Users
      if (val.transition_manager_id && !uniqueUsers.has(val.transition_manager_id)) {
        uniqueUsers.add(val.transition_manager_id);
        const findUser = this.users?.find((user: any) => user._id === val.transition_manager_id)
        this.usersList.push({
          loginName: findUser?.loginName,
          _id: val.transition_manager_id
        });
      }
    });

    // Always keep default as All
    this.filterForm.patchValue({
      account: this.filterForm.value.account ?? '0',
      opportunity: this.filterForm.value.opportunity ?? '0',
      users: this.filterForm.value.users ?? '0',
      status: this.filterForm.value.status ?? '0',
    });
    this.cdRef.detectChanges();
  }

  // Add this helper method to your class
  private safeGetTransitionData(): any {
    const data = this.BbStoreService.getItem("transition");
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing transition data:', e);
      return null;
    }
  }

  private safeSetTransitionData(updates: any): void {
    const existing = this.safeGetTransitionData() || {};
    this.BbStoreService.setItem("transition", JSON.stringify({
      ...existing,
      ...updates
    }));
  }

  async onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridReady = true;

    // If data is already loaded, restore filters now
    if (this.dataLoaded) {
      await this.restoreGridFilters();
    }
  }

  async restoreGridFilters() {
    // Restore saved filters
    const transitionData = this.safeGetTransitionData();
    const savedFilterStr = transitionData?.transitionTableFilter;
    if (savedFilterStr) {
      try {
        const savedFilters = JSON.parse(savedFilterStr);
        this.selectedFilters = savedFilters;

        // Apply filters to the grid
        if (this.gridApi) {
          this.gridApi.setFilterModel(savedFilters);
        }
      } catch (error) {
        console.error("Error restoring filters:", error);
      }
    }
  }

  onTransitionClicked(_event: any) {
    window.open(`transition/view-transition/`, "_blank");
  }
}
