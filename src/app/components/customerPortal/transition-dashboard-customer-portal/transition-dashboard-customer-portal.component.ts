import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, Renderer2, ViewChild, inject } from '@angular/core';
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
import { AgGridDataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component';
import { CategoriesService } from 'projects/customer-management-ui/shared/categories/categories.service';
import { TransitionService } from 'projects/crm-customer-portal-transition-ui/shared/transition/transition.service';
import { firstValueFrom } from 'rxjs';
const transition = "transition";
import { BBLoaderService, BbStoreService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { AgGridDynamicHeightDirective } from '../../sharedUI/directives/ag-grid-header-height/ag-grid-dynamic-height.directive';
import { PAGE_SIZE_SELECTOR } from "../../sharedUI/constants/pagination-list.service"
import { GridOptions } from 'ag-grid-community';
import { CustomerPortalService } from 'projects/crm-customer-portal-transition-ui/shared/customer-portal/customer-portal.service';
import { ExcelService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service';
import { CsatScoreComponent } from '../../transtition/csat/csat-score/csat-score.component';
@Component({
  selector: 'app-transition-dashboard-customer-portal',
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
    AgGridDataTableComponent,
    ReactiveFormsModule, DialogModule, MenuModule, CsatScoreComponent
  ],
  templateUrl: './transition-dashboard-customer-portal.component.html',
  styleUrl: './transition-dashboard-customer-portal.component.scss'
})
export class TransitionDashboardCustomerPortalComponent {
  private router = inject(Router);
  private transitionService = inject(TransitionService);
  private customerPortalService = inject(CustomerPortalService);
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  private cdRef = inject(ChangeDetectorRef);
  private categoryService = inject(CategoriesService);
  private bbToaster = inject(BBToastService);
  private BbStoreService = inject(BbStoreService);
  private bbLoader = inject(BBLoaderService);
  private fb = inject(FormBuilder);
  private excelService = inject(ExcelService);
  private modalService = inject(NgbModal);

  filterForm!: FormGroup;
  confirmForm!: FormGroup;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {

    // Initialize forms in constructor
    this.confirmForm = this.fb.group({
      reason: ['']
    });
  }
  @ViewChild("unsavedChgmodal") unsavedChgModal: any;
  @ViewChild("unsavedChgmodalTransionComplete") unsavedChgmodalTransionComplete: any;
  page = 1;
  actionText: any = '';
  opportunityList: any = [{ cOpportunityName: "All", _id: "0" }];
  usersList: any = [{ loginName: "All", _id: "0" }];
  accountList: any = [{ accountName: "All", _id: "0" }];
  statusList: any = [{ statusName: "All", _id: "0" }];
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
  excelItems: MenuItem[] = [
    { label: "Excel", icon: "bi bi-file-earmark-excel before:text-[15px]", command: () => this.onExport("EXCEL") },
    { label: "CSV", icon: "bi bi-filetype-csv before:text-[15px]", command: () => this.onExport("CSV") },
  ];
  listItemsColumnData: any = [
    {
      headerName: "Transition Id",
      field: "Transition Id",
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
          console.log("params?.data: ", params?.data);
          if (params?.data?.isNew) {
            this.unsavedmodal(this.unsavedChgModal, params?.data);
          } else {
            this.ViewTranstion(params?.data);
          }
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
          console.log("params?.data: ", params?.data);
          if (params?.data?.isNew) {
            this.unsavedmodal(this.unsavedChgModal, params?.data);
          } else {
            this.ViewTranstion(params?.data);
          }
        }
      },
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
      cellClass: "pointer-cell",
    },
    {
      headerName: "Email Id",
      field: "Email Id",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellClass: "pointer-cell",
      onCellClicked: (params: any) => {
        const email = params.value;
        if (email) {
          navigator.clipboard.writeText(email)
          // .then(() => {
          //   this.bbToaster.show_success(`Copied:, ${email}`);
          // }).catch(err => {
          //   this.bbToaster.show_warn(`Copy failed: ${err}`);
          // });
        }
      }
    },
    // {
    //   headerName: "Over All Complaince % (Tollgate)",
    //   field: "Over All Complaince %",
    //   sortable: true,
    //   filter: "checkboxSearchFilter",
    //   // cellRenderer: (params: any) => {
    //   //   return `
    //   //   <span class="rowlink-click text-primary cursor-pointer" data-action="open">
    //   //     ${params.value}
    //   //   </span>
    //   // `;
    //   // },
    // },
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
      headerName: "Transition Status",
      field: "Transition Status",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellRenderer: (params: any) => {
        return `<span class="${params?.data?.transitionClassName}">${params?.data?.transitionStatus ?? ""}</span>`;
      },
    },
    // {
    //   headerName: "Actions",
    //   field: "actions",
    //   cellRenderer: MenuTransitionComponent,
    //   cellRendererParams: {
    //     context: {
    //       componentParent: this,
    //     },
    //   },
    //   suppressMenu: true,
    //   sortable: false,
    //   filter: false,
    //   minWidth: 250,
    // },
  ];
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
  editopportunityPage: { id: any; isEdited: boolean; } | undefined;
  commentEditData: any;
  selectedStatus: any = 'all';
  commentDetail: any;
  users: any = [];
  gridApi: any;
  selectedFilters = {};

  selectedCompanyName: any;
  defTimeZone: string = "Asia/Kolkata";
  showCardsItems: boolean[] = [];
  showcsatSurvey: boolean = false;
  surveyMappedId: any;
  showcsatScore: boolean = false;
  dataLoaded: boolean = false;
  gridReady: boolean = false;
  subClassList: any = [];
  paginationPageSizeSelector = PAGE_SIZE_SELECTOR;
  public gridOptions: GridOptions = {
    popupParent: document.body,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
    },
  };
  async ngOnInit() {
    await this.loadStatuses();
    this.showcsatSurvey = false;
    this.showcsatScore = false;
    this.subClassList = [];
    try {
      this.bbLoader.showLoader();
      await Promise.all([
        this.loadCustomerTransition()
      ]);

    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.bbLoader.hideLoader();
    }
    setTimeout(async () => {
      if (this.gridReady && this.gridApi) {
        await this.restoreGridFilters();
      }
    }, 100)
    this.cdRef.detectChanges();
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
      this.statuses = await firstValueFrom(this.customerPortalService.getCardStatusesTransition("Transition"));
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

  async loadCustomerTransition() {
    try {
      const transition: any = await firstValueFrom(this.customerPortalService.loadCustomerTransition(this.BbStoreService.getItem('roleName')));
      this.rawData = transition?.data ?? [];
      const filteredData = this.rawData.map((item: any) => {
        const score = this.calculateProductCSAT(item);
        const rounded = Math.round(score);
        return {
          ...item,
          ['Products']: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
          ['Transition Id']: item?.transitionNo,
          ['Transition Name']: item?.cTransition_Name,
          Account: item?.accountName,
          AccountName: item?.accountName,
          cOpportunityName: item?.opportunityName,
          productName: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
          cate_className: item?.products?.map((val: any) => val.categoryName).join(", "),
          subClassName: item?.products?.map((val: any) => val.subClassName).join(", "),
          transitionStatus: item?.transitionStatus,
          ['Transition Status']: item?.transitionStatus,
          ['Transition Manager']: item?.transition_manager_name,
          ['Email Id']: item?.transition_manager_emailId,
          // ['Over All Complaince %']: item?.originaloverallscore ? `${Math.round(item?.originaloverallscore)}%` : "",
          ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
          ['Template Name']: item?.mappedProcess,
        };
      });
      this.listItems = filteredData;
      this.datafetching = this.listItems?.length > 0;
      this.table = this.listItems;
      this.originaltable = this.listItems;
      await this.onSetfilterValues();
      await this.GetFilterCounts();
      this.totalRecords = this.rawData?.length;
    } catch (error) {
      console.log('error: ', error);

    }
  }

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

  ViewTranstion(_id: any) {
    console.log('_id: ', _id);
    this.router.navigate([`/${transition}/view-transition`], { state: { _id: _id?._id, transition_completed: _id?.transition_completed, data: { ..._id, isCustomerPortal: true } } });
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
    const surveyResponseArrays = product?.surveyResponse;
    if (!surveyResponseArrays || surveyResponseArrays.length === 0) return 0;

    const surveyResponses = surveyResponseArrays[0];
    if (!surveyResponses || surveyResponses.length === 0) return 0;

    let totalPossibleUsers = surveyResponses.length;
    let totalPossiblePercentage = 100;
    let userWeight = totalPossiblePercentage / totalPossibleUsers;
    let productEarnedPercentage = 0;

    surveyResponses.forEach((userResponse: any) => {
      if (userResponse.isSubmitted && userResponse.response) {
        let userScore = 0;
        let userPossible = 0;

        for (let i = 5; i <= 11; i++) {
          const rating = userResponse.response[`survey_rating_${i}`];

          if (rating === "N/A" || rating === null || rating === undefined || isNaN(rating)) {
            continue;
          }

          userScore += rating;
          userPossible += 5;
        }

        if (userPossible > 0) {
          const userPercent = (userScore / userPossible) * 100;
          productEarnedPercentage += (userWeight * userPercent) / 100;
        }
      }
    });
    return productEarnedPercentage;
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

  async onSearchInput(event: any) {
    this.safeSetTransitionData({
      searchText: event.target.value
    });
    this.searchText = event;
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
    this.listItems = this.rawData;
    this.page = 1;
    this.totalRecords = this.listItems?.length;
    // this.filterShow();
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
        await this.loadCustomerTransition();
        this.bbToaster.show_success(response.message);
      } else {
        this.bbToaster.show_success(response.message);
      }
      dismiss(); // Close the modal

    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.BbStoreService.removeItem('selectedStatus');
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
    const uniqueAccounts = new Set();
    const uniqueUsers = new Set();
    this.listItems?.forEach((val: any, _index: number) => {
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

  async onExport(exportType: string) {
    let fileName = "Transition List";
    const displayedRows: any[] = [];
    console.log('this.gridApi: ', this.gridApi);
    this.gridApi.forEachNodeAfterFilterAndSort((node: { data: any; }) => {
      displayedRows.push(node.data);
    });
    const exportData = displayedRows.map((item: any) => {
      const score = this.calculateProductCSAT(item);
      const rounded = Math.round(score);
      return {
        ['Transition Id']: item?.transitionNo,
        ['Transition Name']: item?.cTransition_Name,
        ['Products']: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
        ['Transition Manager']: item?.transition_manager_name,
        ['Email Id']: item?.transition_manager_emailId,
        ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
        ['Transition Status']: item?.transitionStatus,
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
}

