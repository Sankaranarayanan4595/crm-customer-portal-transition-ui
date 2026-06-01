import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { AgGridDataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component";
import { DrawerModule } from "primeng/drawer";
import { DialogModule } from "primeng/dialog";
import { ChangeDetectorRef } from "@angular/core";
import { firstValueFrom } from "rxjs";
import {
  BBLoaderService,
  BbStoreService,
  BBToastService,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import moment from "moment";
import { Router } from "@angular/router";
import { SelectModule } from "primeng/select";
import { FloatLabel } from "primeng/floatlabel";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SettingsService } from "projects/customer-management-ui/shared/settings.service";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { CustomerService } from "projects/customer-management-ui/shared/customer/customer.service";
import { GridOptions, GridReadyEvent } from "ag-grid-community";
import { MenuItem } from "primeng/api";
import { ExcelService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service";
import { Clipboard } from "@angular/cdk/clipboard";
import { InputTextModule } from "primeng/inputtext";
import { Menu } from "primeng/menu";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { ApproveModalComponent } from "../../sharedUI/approve-modal/approve-modal.component";
import { AgGridDynamicHeightDirective } from "../../sharedUI/directives/ag-grid-header-height/ag-grid-dynamic-height.directive";
const transition = "transition";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";

@Component({
  selector: 'app-approval-request-list',
  imports: [
    AgGridDataTableComponent,
    DrawerModule,
    SelectModule,
    ButtonModule,
    InputTextModule,
    Menu,
    // CommentsOpportunityComponent,
    DialogModule,
    // DatePicker,
    ApproveModalComponent,
    FloatLabel,
    CommonModule,
    ReactiveFormsModule,
    FormsModule, AgGridDynamicHeightDirective,
    IconField,
    InputIcon
  ],
  templateUrl: './approval-request-list.component.html',
  styleUrl: './approval-request-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApprovalRequestListComponent {
  private cdr = inject(ChangeDetectorRef);
  private bbstore = inject(BbStoreService);
  private router = inject(Router);
  private SettingsService = inject(SettingsService);
  private fb = inject(FormBuilder);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private categoryService = inject(CategoriesService);
  private transitionService = inject(TransitionService);
  private customer = inject(CustomerService);
  private excelService = inject(ExcelService);
  private clipboard = inject(Clipboard);

  private gridApi: any;
  public gridOptions: GridOptions = {
    popupParent: document.body,
    onGridReady: (params: GridReadyEvent) => {
      this.gridApi = params.api;
    },
  };
  approvalType: any = [];
  companyData: any[] | undefined;
  opportunityData: any[] | undefined;
  REForm!: FormGroup;
  users: any[] | undefined;
  subclassOptions: any[] = [];
  rawData: any = [];
  table: any = [];
  classId: any;
  filters: any;
  UserID: any;
  excelItems: MenuItem[] = [
    { label: "Excel", icon: "bi bi-file-earmark-excel before:text-[15px]", command: () => this.onExport("EXCEL") },
    { label: "CSV", icon: "bi bi-filetype-csv before:text-[15px]", command: () => this.onExport("CSV") },
  ];
  selectedTblRows: any = [];
  searchTerm = "";

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  formSubmitted: boolean = false;
  exportOptions: any = ["1", "2", "3", "4", "7"];
  visibleComment: boolean = false;
  rejectDialogVisible: boolean = false;
  approveDialogVisible: boolean = false;
  appRej: "approve" | "reject" = "approve";
  rowSelection = {
    mode: "",
  };
  invoiceDetails: any = {
    AccountName: "",
    comment: "",
  };
  listItemsColumnData: any = [
    {
      headerName: "Transition Id",
      field: "Transition Id",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellRenderer: (params: any) => {
        return `
            <span class="rowlink-click text-primary cursor-pointer" data-action="open">
              ${params.value} 
              </span>
              `;
      },
      onCellClicked: (params: any) => {
        if (params.event?.target?.dataset?.action === "open") {
          console.log("params?.data: ", params?.data);
          this.ViewTranstion(params?.data);
        }
      },
    },
    {
      headerName: "Opportunity Name",
      field: "Opportunity Name",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Account Name",
      field: "Account Name",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellRenderer: (params: any) => {
        return `
            <span class="rowlink-click text-primary cursor-pointer" data-action="open">
              ${params.value}
            </span>
          `;
      },
      onCellClicked: (params: any) => {
        if (params.event?.target?.dataset?.action === "open") {
          console.log("params?.data: ", params?.data);
          this.ViewTranstion(params?.data);
        }
      },
    },
    {
      headerName: "Submitted By",
      field: "Submitted By",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Submitted Date",
      field: "Submitted Date",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Request Type",
      field: "Request Type",
      sortable: true,
      filter: "checkboxSearchFilter",
      // cellStyle: {
      //   "white-space": "normal",
      //   "word-wrap": "break-word",
      //   "line-height": "1.4",
      //   "align-items": "center",
      //   "overflow": "auto",
      // }
    },
    {
      headerName: "Awaiting Approval",
      field: "Awaiting Approval",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "Transition Status",
      field: "Transition Status",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellRenderer: (params: any) => {
        const logs = params?.data?.transition_logs ?? [];

        const currentLevelObj = logs[0]?.currentLevel?.find(
          (val: any) => val?.isCurrentLevel === true
        );

        const level = currentLevelObj?.level ?? "";
        return `<span class="${params?.data?.transitionClassName}">${level} ${params?.data?.transitionStatus ?? ""}</span>`;
      },
    }
  ];
  filteredListItems: any = [];
  defTimeZone: any;
  defDateFormat: any;

  async fromDismissMdl(event: any) {
    this.approveDialogVisible = false;
    if (event) {
      await this.ngOnInit();
    }
  }

  private mapToBsDateFormat(format: string): string {
    switch (format.toLowerCase()) {
      case "mm/dd/yyyy":
        return "MM/DD/YYYY";
      case "dd/mm/yyyy":
        return "DD/MM/YYYY";
      case "yyyy/mm/dd":
        return "YYYY/MM/DD";
      default:
        return "MM/DD/YYYY";
    }
  }

  convertDateToDDMMYYYY(dateString: any): string {
    if (!dateString) return "";

    const defTimeZone = this.defTimeZone ? this.defTimeZone : "Asia/Kolkata";
    const defDateFormat = (this.defDateFormat || "mm/dd/yyyy").toLowerCase();

    const formatMap: { [key: string]: string } = {
      "mm/dd/yyyy": "MM/DD/YYYY",
      "dd/mm/yyyy": "DD/MM/YYYY",
      "yyyy/mm/dd": "YYYY/MM/DD",
    };

    const momentFormat = formatMap[defDateFormat] || "MM/DD/YYYY";
    const date = moment.tz(dateString, defTimeZone);

    return date.format(`${momentFormat}`);
  }

  convertDateToDDMMYYYYDateOnly(dateString: any): string {
    if (!dateString) return "";

    const defTimeZone = this.defTimeZone || "Asia/Kolkata";
    const defDateFormat = (this.defDateFormat || "mm/dd/yyyy").toLowerCase();
    const formatMap: { [key: string]: string } = {
      "mm/dd/yyyy": "MM/DD/YYYY",
      "dd/mm/yyyy": "DD/MM/YYYY",
      "yyyy/mm/dd": "YYYY/MM/DD",
    };
    const momentFormat = formatMap[defDateFormat] || "MM/DD/YYYY";

    const date = moment.tz(dateString, defTimeZone);
    return date.format(momentFormat);
  }

  async ngOnInit() {
    this.defTimeZone = this.bbstore.getItem("timeZoneKey");
    this.defDateFormat = this.mapToBsDateFormat(this.bbstore.getItem("dateFormatkey"));

    // Initialize form with only billingMonth as required
    this.REForm = this.fb?.group({
      accountName: [null], // Not required
      oppId: [null], // Not required
      approvalType: [null], // Not required
      oSubClassId: [null], // Not required
      oAccountManagerUserId: [null], // Not required
      billingMonth: [null], // Only this is required
    });

    this.classId = this.customer.recategoryid;
    this.UserID = this.bbstore.getItem("userId");

    await this.loadUsers();
    await this.loadTransitionApprovals();
  }

  async loadSubClassesFromRawData() {
    try {
      // Extract unique subclasses from rawData
      const uniqueSubClassesMap = new Map<string, any>();

      if (this.rawData && this.rawData.length > 0) {
        for (const item of this.rawData) {
          const subclassId = item.oSubClassId;
          const subclassName = item.oSubClassName;

          if (subclassId && !uniqueSubClassesMap.has(subclassId)) {
            uniqueSubClassesMap.set(subclassId, {
              oSubClass_Id: subclassId,
              oSubClassName: subclassName,
            });
          }
        }

        this.subclassOptions = Array.from(uniqueSubClassesMap.values());
        console.log("Loaded subclasses from raw data:", this.subclassOptions);
      }
    } catch (error) {
      console.error("Error loading subclasses from raw data:", error);
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.users = (await this.categoryService.getUsers())?.sort((a: any, b: any) =>
        a.loginName?.localeCompare(b.loginName)
      );
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }

  async onClear() {
    await this.onAllSearch();
    if (this.searchTerm !== '') {
      await this.onAllSearchUnique({ target: { value: this.searchTerm } });
    }
  }
  // UPDATED SEARCH METHOD - Same logic as RealestateInvoicesComponent but only billingMonth mandatory
  async onAllSearch() {
    try {
      this.formSubmitted = true;
      this.bbLoader.showLoader();
      const oAccountManagerUserId = this.REForm.get("oAccountManagerUserId")?.value;
      const companyid = this.REForm.get("accountName")?.value;
      const oppId = this.REForm.get("oppId")?.value;
      const logId = this.REForm.get("approvalType")?.value;

      let filteredData = this.rawData ?? [];

      filteredData = filteredData.filter((item: any) => {
        const matchesAccountManager =
          !oAccountManagerUserId ||
          String(item.transition_manager_id) === String(oAccountManagerUserId);

        const matchesCompany =
          !companyid ||
          String(item.AccountId) === String(companyid);

        const matchesOpp =
          !oppId ||
          String(item.opportunityId) === String(oppId);


        const logs = item?.transition_logs ?? [];

        const matcheslog =
          !logId ||
          String(logs[0]?.comment) === String(logId);

        return (
          matchesAccountManager &&
          matchesCompany &&
          matchesOpp && matcheslog
        );
      });

      // Transform the filtered data for display
      this.filteredListItems = filteredData
        .map((item: any) => this.mapRow(item));

      this.table = this.filteredListItems;

      // Show message if no results found
      if (this.filteredListItems.length === 0) {
        this.bbToaster.show_info("No records found for the selected criteria");
      }
    } catch (error: any) {
      console.error("Error searching approval requests:", error);
      this.bbToaster.show_error("Error searching approval requests.");
    } finally {
      this.formSubmitted = false;
      await this.onAllSearchUnique({ target: { value: this.searchTerm } });
      this.bbLoader.hideLoader();
      this.cdr.detectChanges();
    }
  }

  clearForm() {
    this.REForm.reset();
    this.loadTransitionApprovals(); // Reload all data when form is cleared
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

  async loadTransitionApprovals() {
    try {
      const transition: any = await firstValueFrom(this.transitionService.loadExitingApprovalTransitionRequest());
      this.rawData = transition?.data;
      const filteredData = this.rawData
        .map((item: any) => this.mapRow(item));
      this.filteredListItems = filteredData;
      this.table = this.filteredListItems;
      // Prepare company data for dropdown
      const uniqueCompaniesMap = new Map<string, any>();
      const uniqueOpportunityMap = new Map<string, any>();
      const uniqueApprovalTypeMap = new Map<string, any>();

      for (const item of this.rawData) {
        const companyId = item.AccountId;
        const companyName = item.accountName || item.accountName;

        if (companyId && !uniqueCompaniesMap.has(companyId)) {
          uniqueCompaniesMap.set(companyId, {
            oCompany_Id: companyId,
            company_name: companyName,
          });
        }
        const oppId = item.opportunityId;
        const oppName = item.opportunityName || item.opportunityName;

        if (oppId && !uniqueOpportunityMap.has(oppId)) {
          uniqueOpportunityMap.set(oppId, {
            oppId: oppId,
            oppName: oppName,
          });
        }

        const logs = item?.transition_logs ?? [];

        const logId = logs[0]?.comment;
        const logName = logs[0]?.comment;

        if (logId && !uniqueApprovalTypeMap.has(logId)) {
          uniqueApprovalTypeMap.set(logId, {
            logId: logId,
            logName: logName,
          });
        }
      }

      this.companyData = Array.from(uniqueCompaniesMap.values());
      this.opportunityData = Array.from(uniqueOpportunityMap.values());
      this.approvalType = Array.from(uniqueApprovalTypeMap.values());
    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  ViewTranstion(_id: any) {
    this.router.navigate([`/${transition}/view-transition`], { state: { _id: _id?._id, transition_completed: _id?.transition_completed, data: { ..._id, isApprovalLevel: true, isRequestView: true } } });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.REForm?.get(fieldName);
    return !!field && field.invalid && (field.touched || this.formSubmitted);
  }

  convertToPuntuation() {
    return this.SettingsService.currencyWithAmount("$", this.invoiceDetails?._id?.Total)
  }

  async onExport(exportType: string) {
    let exportData: any[] = [];
    let fileName = "Transition_requests_list";
    const displayedRows: any[] = [];
    this.gridApi.forEachNodeAfterFilterAndSort((node: { data: any; }) => {
      displayedRows.push(node.data);
    });
    exportData = displayedRows?.map((item: any) => {
      const findUser = this.users?.find((user: any) => user._id === item.transition_logs[0].cCreatedBy);
      this.calculateProductCSAT(item);
      const logs = item?.transition_logs ?? [];

      const currentLevelObj = logs[0]?.currentLevel?.find(
        (val: any) => val?.isCurrentLevel === true
      );

      const level = currentLevelObj?.level ?? "";
      const userIds = item?.transition_logs[0]?.currentLevel?.map((u: any) => u.user_id);
      const awaitingApprovers = this.users?.filter((user: any) => userIds.includes(user._id))?.map((u: any) => u.empName).join(", ");

      return {
        ['Transition Id']: item?.transitionNo,
        ["Opportunity Name"]: item?.opportunityName,
        ["Account Name"]: item?.accountName,
        ['Submitted By']: findUser.empName,
        ['Submitted Date']: moment(item?.transition_logs[0]?.dCreatedAt).format(this.defDateFormat),
        ["Request Type"]: logs[0]?.comment,
        ["Awaiting Approval"]: awaitingApprovers,
        ['Transition Status']: `${level} ${item?.transitionStatus}`,
      }
    });
    /* ---------------- EXPORT ---------------- */
    if (exportType === "EXCEL") {
      this.excelService.ExportTOExcelWithImage(exportData, fileName);
    } else if (exportType === "PDF") {
      this.excelService.exportToPdf(exportData, fileName);
    } else if (exportType === "CSV") {
      this.excelService.exportToCsv(exportData, fileName);
    } else if (exportType === "Print") {
      this.excelService.printTable(exportData, fileName);
    } else if (exportType === 'Copy') {
      const tableData = await this.getTableContentAsString(exportData);
      this.copyToClipboard(tableData)
    }
  }

  async getTableContentAsString(tableData: any) {
    let tableContent = "";
    if (tableData.length === 0) {
      return tableContent;
    }
    const headers = Object.keys(tableData[0]).join("\t");
    tableContent += headers + "\n";
    tableData.forEach((row: any) => {
      const rowData = Object.values(row).join("\t");
      tableContent += rowData + "\n";
    });
    return tableContent;
  }
  copyToClipboard(content: string) {
    this.clipboard.copy(content);
    this.bbToaster.show_success("Copied to clipboard");
  }
  onSelectedFiles(selectedRows: any) {
    this.selectedTblRows = selectedRows;
    console.log(this.selectedTblRows, "selectedTblRows");
  }

  async clearSearch() {
    this.searchTerm = '';
    await this.onAllSearchUnique({ target: { value: '' } });
  }

  async onAllSearchUnique(event: any) {
    const search = (event.target.value || "").toLowerCase();
    this.searchTerm = search;

    if (search === '') {
      const Data = this.rawData
        .map((item: any) => this.mapRow(item));
      this.table = Data;
      this.filteredListItems = Data;
      this.onFilterChanged(this.filters);
    } else {
      this.filteredListItems = this.table.filter((row: any) => {
        const matchesNormalFields = Object.values(row).some((value: any) =>
          String(value).toLowerCase().includes(search)
        );
        const matchesCompanyCode =
          row._id?.cCompanyCode &&
          row._id.cCompanyCode.toLowerCase().includes(search);
        return matchesNormalFields || matchesCompanyCode;
      });
    }

  }

  async onFilterChanged(event: any) {
    try {

      console.log('event:', event);

      // ✅ Check if filters are empty
      if (!event || Object.keys(event).length === 0) {
        const mappedData = this.rawData.map((item: any) => this.mapRow(item));
        this.filteredListItems = mappedData;
        this.table = mappedData;
        return;
      }

      this.filters = event;

      // ✅ Always filter from rawData (not already filtered data)
      const filteredData = this.rawData
        .map((item: any) => this.mapRow(item))
        .filter((row: any) => {
          return Object.keys(this.filters).every((key: string) => {
            const filterValues = this.filters[key]?.values;

            if (!filterValues || filterValues.length === 0) return true;

            return filterValues.includes(row[key]);
          });
        });

      this.filteredListItems = filteredData;
      this.table = filteredData;
    } catch (error) {
      console.log('error: ', error);

    } finally {
      await this.onAllSearch();
    }
  }


  private mapRow(item: any) {
    const findUser = this.users?.find((user: any) => user._id === item.transition_logs[0].cCreatedBy);
    this.calculateProductCSAT(item);
    const logs = item?.transition_logs ?? [];

    const currentLevelObj = logs[0]?.currentLevel?.find(
      (val: any) => val?.isCurrentLevel === true
    );

    const level = currentLevelObj?.level ?? "";
    const userIds = item?.transition_logs[0]?.currentLevel?.map((u: any) => u.user_id);
    const awaitingApprovers = this.users?.filter((user: any) => userIds.includes(user._id))?.map((u: any) => u.empName).join(", ");

    return {
      ...item,
      ['Product Name']: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
      ['Transition Id']: item?.transitionNo,
      ["Account Name"]: item?.accountName,
      ["Opportunity Name"]: item?.opportunityName,
      ['Submitted By']: findUser.empName,
      ['Submitted Date']: moment(item?.transition_logs[0]?.dCreatedAt).format(this.defDateFormat),
      AccountName: item?.accountName,
      cOpportunityName: item?.opportunityName,
      productName: item?.products?.map((val: any) => val.cFeaturesDesc).join(", "),
      cate_className: item?.products?.map((val: any) => val.categoryName).join(", "),
      subClassName: item?.products?.map((val: any) => val.subClassName).join(", "),
      transitionStatus: item?.transitionStatus,
      ['Transition Status']: `${level} ${item?.transitionStatus}`,
      ["Awaiting Approval"]: awaitingApprovers,
      // ['Over All Complaince %']: item?.originaloverallscore ? `${Math.round(item?.originaloverallscore)}%` : "",
      // ['CSAT %']: rounded ? `${rounded}%` : item?.surveyResponse?.length > 0 ? `0%` : "",
      ['Template Name']: item?.mappedProcess,
      ["Request Type"]: logs[0]?.comment

    };
  }
}
