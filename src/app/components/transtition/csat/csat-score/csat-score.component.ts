import { TransitionService } from "projects/crm-customer-portal-transition-ui/shared/transition/transition.service";
import { firstValueFrom } from "rxjs";
import { BBLoaderService, BbStoreService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { ButtonModule } from "primeng/button";
import { AccordionModule } from "primeng/accordion";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { BadgeModule } from "primeng/badge";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { ToastModule } from "primeng/toast";
import { ExcelService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service";
import { MenuItem } from "primeng/api";
import { FloatLabel } from "primeng/floatlabel";
import { Menu } from "primeng/menu";
import { MessagetransferService } from "projects/customer-management-ui/shared/message/messagetransfer.service";
import { DialogModule } from "primeng/dialog";

import {
  Component,
  PLATFORM_ID,
  ChangeDetectorRef,
  inject,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
} from "@angular/core";
import { ChartModule } from "primeng/chart";
import { AgGridDataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component";
import moment from "moment";
import { Select } from "primeng/select";
// import { AppConfigService } from '@/service/appconfigservice';
@Component({
  selector: "app-csat-score",
  imports: [
    CommonModule,
    AccordionModule,
    BadgeModule,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    ToastModule,
    ChartModule,
    ButtonModule,
    DialogModule,
    AgGridDataTableComponent,
    Menu,
    FloatLabel,
    Select

  ],
  templateUrl: "./csat-score.component.html",
  styleUrl: "./csat-score.component.scss",
})
export class CsatScoreComponent {
  private MessagetransferService = inject(MessagetransferService);
  private TransitionService = inject(TransitionService);
  private cd = inject(ChangeDetectorRef);
  private bbloader = inject(BBLoaderService);
  private bbStore = inject(BbStoreService);
  private excelService = inject(ExcelService);

  @ViewChild("htmlSection") htmlSection?: ElementRef;
  data: any;
  themeClass: any;
  listItemsColumnData: any;
  exportOptions: any = ["1", "2", "3", "4", "7"];
  listItems: any;
  table: any;
  rawData: any;
  options: any;
  platformId = inject(PLATFORM_ID);
  surveyScores: any;
  numberOfResponses: string = "0/0";
  responseRate: string = "0%";
  csatScore: number = 0;
  clientName: any;
  @Input() transitionId!: any;
  @Input() surveyMappedId!: any;
  @Input() isCustomerPortal: boolean = false;
  isTask: boolean = false;
  @Output() onChangeTaskComponent = new EventEmitter<any>();
  selectedParticipant: any;
  showConfirmModal: boolean = false;
  showSuccessModal: boolean = false;
  excelItems: MenuItem[] = [
    { label: "Export Excel", icon: "bi bi-filetype-exe text-2xl", command: () => this.onExport("EXCEL") },
    { label: "Export CSV", icon: "bi bi-filetype-csv text-2xl", command: () => this.onExport("CSV") },
    { label: "Export PDF", icon: "bi bi-filetype-pdf text-2xl", command: () => this.onExport("PDF") },
  ];
  searchTerm: any = '';

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  // configService = inject(AppConfigService);
  // designerService = inject(DesignerService);
  constructor() { }
  // themeEffect = effect(() => {
  //       if (this.configService.transitionComplete()) {
  //           if (this.designerService.preset()) {
  //               this.initChart();
  //           }
  //       }
  //   });
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
  defTimeZone: any;
  defDateFormat: any;
  subClassList: any = [{
    _id: "0",
    name: "All"
  }];
  async ngOnInit() {
    this.defTimeZone = this.bbStore.getItem("timeZoneKey");
    console.log('this.defTimeZone: ', this.defTimeZone);
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey"));
    console.log('this.defDateFormat: ', this.defDateFormat);
    try {
      this.bbloader.showLoader();

      if (this.surveyMappedId) {
        this.isTask = true;
      } else {
        this.MessagetransferService.csatSurveyScoreId$.subscribe((id) => {
          this.surveyMappedId = id;
        });
      }
      await this.loadSurveyScores();
      await this.initChart();
    } catch (error) {
      console.error("Error initializing component:", error);
    } finally {
      this.bbloader.hideLoader();
      this.cd.markForCheck();
    }
  }

  toProdServices() {
    // if (this.isTask) {
    this.onChangeTaskComponent.emit(false);
    // } else {
    //   this.MessagetransferService.manageDocValueFn("csatScore");
    // }
    // this.router.navigate([`/customer/dashboard`]);
  }

  async loadSurveyScores() {
    try {
      const surveyScores = await firstValueFrom(
        this.TransitionService.getCSATScoreById(this.surveyMappedId)
      );

      this.surveyScores = surveyScores.data;
      console.log("this.surveyScores:", this.surveyScores);

      const submitted = this.surveyScores.submittedResponses || 0;
      const total = this.surveyScores.totalRespondents || 0;

      this.subClassList = [{ _id: "0", name: "All" }];

      this.csatScore =
        this.surveyScores.recipients_response
          ?.filter((i: any) => i.isSubmitted)
          ?.reduce(
            (sum: any, acc: any) => sum + (acc.individualScore ?? 0),
            0
          ) /
        this.surveyScores.recipients_response?.filter(
          (i: any) => i.isSubmitted
        )?.length || 0;

      this.numberOfResponses = `${submitted}/${total}`;
      this.responseRate =
        total > 0 ? `${Math.round((submitted / total) * 100)}%` : "0%";

      this.rawData = this.surveyScores?.recipients_response || [];

      /* ===================== SUBCLASS LIST ===================== */

      const listSubclass =
        this.rawData?.map((val: any) => ({
          _id: val?.cSurveyTemplateId?.subClassId?._id,
          name: val?.cSurveyTemplateId?.subClassId?.cSubClassName,
        })) ?? [];

      const uniqueSubclass = [
        ...new Map(listSubclass.map((i: any) => [i._id, i])).values(),
      ];

      this.subClassList.push(...uniqueSubclass);

      /* ===================== STEP 1: COLLECT DYNAMIC KEYS ===================== */

      const fieldKeyMap: Record<string, string> = {};

      this.rawData.forEach((item: any) => {
        const responses = item.formattedResponses || {};
        Object.keys(responses).forEach((originalKey) => {
          // ✅ KEEP SPACES — no sanitization
          fieldKeyMap[originalKey] = originalKey;
        });
      });

      /* ===================== STEP 2: BUILD ROW DATA ===================== */

      const filteredData = this.rawData.map((item: any, index: number) => {
        const baseObj: any = {
          ID: index + 1,
          individualScore:
            item?.individualScore != null
              ? Number.isInteger(item.individualScore)
                ? `${item.individualScore.toFixed(0)}%`
                : `${item.individualScore.toFixed(2)}%`
              : null,
          Email: item?.email,
          SubClass: item?.cSurveyTemplateId?.subClassId?.cSubClassName,
          surveyEndTime:
            this.convertDateToDDMMYYYY(item?.surveyEndTime) ?? "",
          surveyStartTime:
            this.convertDateToDDMMYYYY(item?.surveyStartTime) ?? "",
          _id: { ...item },
        };

        const formattedResponses = item.formattedResponses || {};

        Object.entries(fieldKeyMap).forEach(([originalKey]) => {
          baseObj[originalKey] = formattedResponses[originalKey] ?? "";
        });

        return baseObj;
      });

      this.listItems = filteredData;

      /* ===================== STATIC COLUMNS ===================== */

      const staticColumns = [
        { headerName: "ID", field: "ID", sortable: true, filter: "checkboxSearchFilter" },
        { headerName: "Start Time", field: "surveyStartTime", sortable: true, filter: "checkboxSearchFilter" },
        { headerName: "Completion Time", field: "surveyEndTime", sortable: true, filter: "checkboxSearchFilter" },
        { headerName: "Email", field: "Email", sortable: true, filter: "checkboxSearchFilter" },
        { headerName: "Sub Class", field: "SubClass", sortable: true, filter: "checkboxSearchFilter" },
        { headerName: "Score", field: "individualScore", sortable: true, filter: "checkboxSearchFilter" },
      ];

      /* ===================== DYNAMIC COLUMNS ===================== */

      const dynamicColumns = Object.keys(fieldKeyMap).map((key) => {
        const columnValues = filteredData
          .map((fd: any) => fd[key])
          .filter((v: any) => v !== null && v !== undefined && String(v) !== "");

        const isNumeric =
          columnValues.length > 0 &&
          columnValues.every((v: any) => {
            const normalized = String(v).replace(/[,\s%₹$]/g, "");
            return normalized !== "" && !Number.isNaN(Number(normalized));
          });

        return {
          headerName: key,
          field: key,
          sortable: true,
          filter: "checkboxSearchFilter",
          valueFormatter: (params: any) => {
            const val = params.value;
            if (val === null || val === undefined || String(val).trim() === "")
              return "";
            if (!isNumeric) return val;
            const normalized = String(val).replace(/[,\s%₹$]/g, "");
            const n = Number(normalized);
            return Number.isNaN(n) ? val : n;
          },
        };
      });

      /* ===================== STATUS COLUMN ===================== */

      const statusColumn = {
        headerName: "Status",
        field: "status",
        cellRenderer: (params: any) => {
          const response = params.data?._id?.response;
          const score = this.getParticipantScore(response);
          const status = this.getParticipantStatus(score);
          const cssClass = this.getScoreText(score);
          return `<span class="${cssClass}">${status}</span>`;
        },
        suppressMenu: true,
        sortable: false,
        filter: "checkboxSearchFilter",
      };

      /* ===================== ACTION COLUMN ===================== */

      const actionColumn: any = {
        headerName: "Actions",
        field: "actions",
        cellRenderer: () => `
        <div class="flex items-center justify-start gap-3 mt-3">
          <i class="bi bi-envelope-arrow-up fs-3 cursor-pointer"
             title="Resend"
             data-action="Resend"></i>
        </div>
      `,
        onCellClicked: (params: any) => {
          const target: any = params.event.target as HTMLElement;
          if (target?.dataset?.action === "Resend") {
            params.event.stopPropagation();
            this.showConfirmModalPop(params?.data?._id);
          }
        },
        suppressMenu: true,
        sortable: false,
        filter: false,
      };

      /* ===================== FINAL COLUMNS ===================== */

      const columns = [
        ...staticColumns,
        ...dynamicColumns,
        statusColumn,
      ];

      if (!this.isCustomerPortal) {
        columns.push(actionColumn);
      }

      this.listItemsColumnData = columns;

      /* ===================== FINAL ROW FORMAT ===================== */

      this.listItems = this.listItems.map((item: any) => {
        const response = item?._id?.response ?? {};
        const score = this.getParticipantScore(response);
        const status = this.getParticipantStatus(score);

        const formattedItem = { ...item };

        Object.keys(item).forEach((key) => {
          if (
            this.isValidDate(item[key]) &&
            !staticColumns.map((c: any) => c.field).includes(key)
          ) {
            formattedItem[key] = this.convertDateToDDMMYYYY(item[key], false);
          }
        });

        return {
          ...formattedItem,
          status,
        };
      });

      console.log("Final table data:", this.listItems);
    } catch (error) {
      console.error("Error fetching Survey scores:", error);
    }
  }

  getRatingLabel(value: number): string {
    const labels: { [key: number]: string } = {
      1: 'Lowest',
      5: 'Highest',
    };
    return labels[value] || '';
  }


  isValidDate(value: any): boolean {
    if (!value || typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }


  getParticipantClientName(participant: any): { name: any; product: any } {
    if (!participant.isSubmitted || !participant.response) return { name: "", product: "" };
    const nameFieldKey = Object.keys(participant.response).find((key) => key.startsWith("survey_field_name_"));
    const productFieldKey = Object.keys(participant.response).find((key) => key.startsWith("survey_field_product_"));
    return {
      name: nameFieldKey ? participant.response[nameFieldKey] : "",
      product: productFieldKey ? participant.response[productFieldKey] : "",
    };
  }

  getParticipantScore(response: any): number {
    if (!response) return 0;

    const ratings = Object.keys(response)
      .filter((key) => key.startsWith("survey_rating_"))
      .map((key) => response[key])
      .filter((r) => r !== "N/A");

    const total = ratings.reduce((sum, r) => sum + (typeof r === "number" ? r : 0), 0);
    const max = ratings.length * 5;
    return max > 0 ? (total / max) * 100 : 0;
  }

  getParticipantScoreDetails(response: any) {
    if (!response) return { total: 0, max: 0, percent: 0 };

    const ratings = Object.keys(response)
      .filter((key) => key.startsWith("survey_rating_"))
      .map((key) => response[key])
      .filter((r) => r !== "N/A");

    const total = ratings.reduce((sum, r) => sum + (typeof r === "number" ? r : 0), 0);
    const max = ratings.length * 5;
    const percent = max > 0 ? (total / max) * 100 : 0;

    return { total, max, percent };
  }

  getParticipantStatus(score: number): string {
    if (score >= 80) return "Exceeds Expectation";
    if (score >= 16) return "Met Expectation";
    return "Needs Improvement";
  }

  getScoreText(score: number): string {
    if (score >= 80) return "status-green";
    if (score >= 16) return "status-orange";
    return "status-red";
  }

  getRatingEntries(ratingResponses: any) {
    if (!ratingResponses) return [];
    return Object.entries(ratingResponses).map(([key, value]) => {
      const label = key.replace(/^\d+\.\s*/, "");

      let formattedValue = value;
      if (typeof value === "string" && !isNaN(Date.parse(value))) {
        const date = new Date(value);
        formattedValue = `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
          .getDate()
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`;
      }

      return { label, value: formattedValue };
    });
  }

  async initChart() {
    if (isPlatformBrowser(this.platformId)) {
      const docStyle = getComputedStyle(document.documentElement);
      const textColor = docStyle.getPropertyValue("--p-text-color") || "#333";

      let exceed = 0;
      let Met = 0;
      let Need = 0;
      if (this.csatScore >= 80) {
        exceed = Number(this.csatScore);
      } else if (this.csatScore >= 16) {
        Met = Number(this.csatScore);
      } else {
        Need = Number(this.csatScore);
      }
      this.data = {
        // labels: ["80-100% Exceeds Expectation", "16-79% Met Expectatioin", "0-15% Need Improvements"],
        datasets: [
          {
            data: [exceed, Met, Need],
            backgroundColor: ["#0d3133", "#e69f50", "#b5b3b0"],
            hoverBackgroundColor: ["#0d3133", "#e69f50", "#b5b3b0"],
          },
        ],
      };

      this.options = {
        cutout: "60%",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: textColor,
            },
          },
        },
      };
      this.cd.markForCheck();
    }
  }

  showConfirmModalPop(participant: any) {
    this.selectedParticipant = participant;
    this.showConfirmModal = true;
  }

  cancelResend() {
    this.showConfirmModal = false;
    this.selectedParticipant = null;
  }

  async confirmResend() {
    if (!this.selectedParticipant) return;

    try {
      this.bbloader.showLoader();
      this.showConfirmModal = false;

      const payload = {
        surveyMappedId: this.surveyMappedId,
        email: this.selectedParticipant.email,
        resend: true,
      };

      const response = await firstValueFrom(this.TransitionService.resendSurvey(payload));

      if (response.success) {
        this.showSuccessModal = true;
        await this.loadSurveyScores();
      } else {
      }
    } catch (error) {
      console.error("Error resending survey:", error);
    } finally {
      this.bbloader.hideLoader();
      this.cd.markForCheck();
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
    this.selectedParticipant = null;
  }

  async onExport(exportType: string) {
    const exportData = this.listItems.map(({ _id, ...rest }: any) => rest);
    console.log('this.listItems: ', this.listItems);
    // if (["EXCEL", "PDF"].includes(exportType)) {
    //   const element = this.htmlSection?.nativeElement;
    //   const dataUrl = await htmlToImage.toPng(element, { quality: 1, pixelRatio: 2 });
    //   if (dataUrl) {
    //     const headers = Object.keys(exportData[0]);
    //     const imageRow: { [key: string]: string } = {};
    //     headers.forEach((header, index) => {
    //       imageRow[header] = index === 0 ? dataUrl : "";
    //     });

    //     if (exportType === "EXCEL") {
    //       (imageRow as any).isHeaderImage = true;
    //     } else {
    //       (imageRow as any).isImageRow = true;
    //     }
    //     exportData.unshift(imageRow);
    //   }
    // }
    console.log("exportType: ", exportType);
    if (exportType === "EXCEL") {
      this.excelService.ExportTOExcelWithImage(exportData, "csat_score");
    } else if (exportType === "PDF") {
      this.excelService.exportToPdf(exportData, "csat_score");
    } else if (exportType === "CSV") {
      this.excelService.exportToCsv(exportData, "csat_score");
    } else if (exportType === "PRINT") {
      this.excelService.printTable(exportData, "csat_score");
    }
  }

  convertDateToDDMMYYYY(dateString: any, isTimeStamp: boolean = true): string {
    if (!dateString) return ''; // Handle null/undefined

    // Use default timezone or fallback
    const defTimeZone = this.defTimeZone || 'Asia/Kolkata';

    // Use default date format or fallback
    const defDateFormat = (this.defDateFormat || 'mm/dd/yyyy').toLowerCase();

    // Map of input formats to Moment.js format strings
    const formatMap: { [key: string]: string } = {
      'mm/dd/yyyy': 'MM/DD/YYYY',
      'dd/mm/yyyy': 'DD/MM/YYYY',
      'yyyy/mm/dd': 'YYYY/MM/DD',
    };

    // Use mapped format or fallback
    const momentFormat = formatMap[defDateFormat] || 'MM/DD/YYYY';

    // Parse the date string with timezone awareness
    const date = moment.tz(dateString, defTimeZone);
    if (isTimeStamp) {
      // Format date + time as "DATE HH.mm"
      return date.format(`${momentFormat} HH.mm`);
    } else {
      return date.format(`${momentFormat}`);
    }
  }

  onChangeSubClass(event: any) {
    const value = event.value;
    if (value === "0") {
      const submitted = this.surveyScores.submittedResponses || 0;
      const total = this.surveyScores.totalRespondents || 0;
      this.csatScore = this.surveyScores.score || 0;
      this.numberOfResponses = `${submitted}/${total}`;
      this.responseRate = total > 0 ? `${Math.round((submitted / total) * 100)}%` : "0%";
    } else {
      const findResponse = this.surveyScores?.recipients_response?.filter((val: any) => val.cSurveyTemplateId?.subClassId?._id === value);
      this.csatScore = findResponse?.reduce((sum: any, acc: any) => sum + (acc.individualScore ?? 0), 0) / findResponse?.length || 0;
      const submittedResponse = findResponse?.filter((val: any) => val.response)?.length;
      this.numberOfResponses = `${submittedResponse}/${findResponse?.length}`;
      this.responseRate = findResponse?.length > 0 ? `${Math.round((submittedResponse / findResponse?.length) * 100)}%` : "0%";
    }
  }

  async clearSearch() {
    this.searchTerm = '';
    await this.onAllSearchUnique({ target: { value: '' } });
  }

  async onAllSearchUnique(event: any) {
    const search = (event.target.value || "").toLowerCase();
    this.searchTerm = search;

    if (search === '') {
      this.listItems = this.table;
    } else {
      this.listItems = this.table.filter((row: any) => {
        const matchesNormalFields = Object.values(row).some((value: any) =>
          String(value).toLowerCase().includes(search)
        );
        return matchesNormalFields;
      });
    }

  }

}
