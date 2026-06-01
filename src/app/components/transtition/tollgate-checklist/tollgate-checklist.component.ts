import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output, QueryList, SimpleChanges, ViewChild, ViewChildren, inject } from "@angular/core";
import { TransitionDataTableComponent } from "../../common/transition-data-table/transition-data-table.component";
// import { FormsService } from "projects/BBForms-ui/src/public-api";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import { firstValueFrom } from "rxjs";
import { BBLoaderService, BbStoreService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { ButtonModule } from "primeng/button";
import { AccordionModule } from "primeng/accordion";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
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
import { FloatLabel } from "primeng/floatlabel";
import { Checkbox } from "primeng/checkbox";
import { SelectModule } from "primeng/select";
import moment from "moment";
import { CustomerPortalService } from "projects/crm-customer-portal-transition-ui/shared/customer-portal/customer-portal.service";
@Component({
  selector: "app-tollgate-checklist",
  imports: [
    TransitionDataTableComponent,
    ButtonModule,
    AccordionModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    FloatLabel,
    Knob,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    ToastModule,
    TooltipModule,
    Checkbox,
    SelectModule, BadgeModule
  ],
  templateUrl: "./tollgate-checklist.component.html",
  styleUrl: "./tollgate-checklist.component.scss",
})
export class TollgateChecklistComponent {
  // private formService = inject(FormsService);
  private transitionService = inject(TransitionService);
  private bbLoader = inject(BBLoaderService);
  // private bbToaster = inject(BBToastService);
  // private route = inject(ActivatedRoute);
  // private excelService = inject(ExcelService);
  private cdr = inject(ChangeDetectorRef);
  private bbStore = inject(BbStoreService);
  private customerPortalService = inject(CustomerPortalService);

  exportdata!: Record<string, any>[];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }
  isCustomerActionList: any = [];
  goLiveOptions: any[] = [
    { name: "YES", code: "YES" },
    { name: "NO", code: "NO" }
  ];
  @ViewChild('transitionDataTable') transitionDataTable!: TransitionDataTableComponent;
  @ViewChildren('transitionDataTable') transitionDataTables!: QueryList<TransitionDataTableComponent>;
  @Input() searchTerm = "";
  goLiveReadiness: any = { name: "NO", code: "NO" };
  // private observer!: MutationObserver;
  @Output() exportRequested = new EventEmitter<string>();
  @Output() updateTemplate = new EventEmitter<any>();
  // private saveTimer: any;
  excelItems: MenuItem[] = [
    { label: 'Export Excel', icon: 'pi pi-file-excel', command: () => this.exportRequested.emit('EXCEL') },
    { label: 'Export CSV', icon: 'pi pi-file', command: () => this.exportRequested.emit('CSV') },
    { label: 'Export PDF', icon: 'pi pi-file-pdf', command: () => this.exportRequested.emit('PDF') }
  ];
  formKnob!: FormGroup;
  formData: any;
  templateFormData: any = [];
  template: any;
  phases_list: any;
  templateId!: string;
  showPhasesTransition: boolean = false;
  isModified: boolean = false;
  phases_table: boolean = false;
  original_phases_list: any;
  originalTemplateFormData: any = [];
  phaseName!: string;
  transitionId!: any;
  templateData: any;
  overallComplianceChecked: any;
  finalUpdatedData: any = {}; // ✅ Ensure it's initialized
  @ViewChild("setFormIoWidth", { static: false }) setFormIoWidth!: ElementRef;
  transitionPeriod: any;
  plannedGoLiveDate: any = null;
  defaultDateRange: any;
  isExporting: boolean = false;
  @ViewChild("htmlSection") htmlSection!: ElementRef;
  @ViewChild("filename") filename!: ElementRef;
  overAllComplainceScore: number = 0;
  defDateFormat: any;
  defTimeZone: any;
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
  userId: any;
  transitionData: any;
  transition_completed: boolean = false;

  async ngOnInit() {
    this.userId = this.bbStore.getItem("userId");
    this.defTimeZone = this.bbStore.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey") || 'mm/dd/yyyy');
    this.transitionId = history.state._id;
    this.transitionData = history.state.data;
    this.isCustomerPortal = history.state.data?.isCustomerPortal ?? false;
    this.transition_completed = history.state.transition_completed;

    if (this.transitionId) {
      await this.loadTemplatMapping();
    }
    this.formKnob = new FormGroup({
      value: new FormControl(32),
    });
    const today = this.formatDate(new Date());
    this.transitionPeriod = {
      startDate: today,
      endDate: today,
    };
    // this.formService.getFormsByID("68775ada15024a491eb0ee25").subscribe((response: any) => {
    //   console.log('response: ', response);
    //   this.formData = response;
    // });
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
    if (changes["searchTerm"] && !changes["searchTerm"].firstChange) {
      await this.onSerchResult();
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
        if (this.original_phases_list === undefined) {
          this.phases_list = this.original_phases_list;
        }
        if (this.originalTemplateFormData?.length > 0) {
          this.templateFormData = this.originalTemplateFormData;
        }
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
    // Preprocess for quick lookup
    console.log('this.templateData: ', this.templateData);

    const phaseDetailsMap = new Map(
      this.templateData?.transitionDetails?.map((val: any) => [val.oPhaseId, val])
    );
    this.phases_list = (this.templateData?.phase_info || []).map((item: any) => {
      const phaseDetail: any = phaseDetailsMap.get(item._id);
      let score = 0;
      let color = '#3A423E';

      if (phaseDetail?.tollgateValues || this.finalUpdatedData[this.templateId]) {
        const entries = isUpdated && phaseDetail.oTemplateId === this.templateId ? Object.entries(this.finalUpdatedData[this.templateId] || {}) : Object.entries(phaseDetail?.tollgateValues || {});

        const validCount = entries.filter(([k]) => k.startsWith('tollgate_status_')).length;
        const totalScore = entries
          .filter(([k]) => k.startsWith('tollgate_score_'))
          .reduce((sum, [, val]: any) => sum + parseInt(val || '0', 10), 0);
        const maxPossible = validCount * 10;

        score = validCount > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

        color = score >= 90
          ? '#00AB55'
          : (score >= 75 && score <= 89)
            ? '#FF6D00'
            : '#8C0000';
      }

      return {
        phaseName: item?.cPhaseName,
        phase_id: item?._id,
        _id: phaseDetail?.oTemplateId,
        score_template: `${score}%`,
        score,
        color,
        iSortOrder: phaseDetail.iSortOrder

      };
    });
    this.phases_list = this.phases_list?.sort((a: any, b: any) => a.iSortOrder - b.iSortOrder);
  }
  async loadTemplate() {
    try {

      this.finalUpdatedData = {};
      this.templateFormData = [];

      this.phases_table = true;

      if (this.templateData?.phasesTableValues) {
        if (this.templateData?.phasesTableValues) {
          if (this.templateData.phasesTableValues?.transitionPeriod) {
            this.transitionPeriod = { startDate: this.convertDateToDDMMYYYY(this.templateData.phasesTableValues.transitionPeriod.startDate), endDate: this.convertDateToDDMMYYYY(this.templateData.phasesTableValues.transitionPeriod.endDate) };
            this.defaultDateRange = this.templateData.phasesTableValues.transitionPeriod;
          }

          if (this.templateData.phasesTableValues?.plannedGoLiveDate) {
            // const liveDate = moment(
            //   this.templateData.phasesTableValues.plannedGoLiveDate,
            //   ["MM-DD-YYYY", "YYYY-MM-DD", moment.ISO_8601],
            //   true
            // );
            this.plannedGoLiveDate = this.convertDateToDDMMYYYY(this.templateData.phasesTableValues.plannedGoLiveDate) || null;
          } else {
            this.plannedGoLiveDate = null; // show empty in calendar
          }

        }
        this.overallComplianceChecked = this.templateData?.phasesTableValues?.overallComplianceTollGate ? ["Normal"] : []
        this.goLiveReadiness = this.templateData?.phasesTableValues?.goLiveReadiness === "YES" ? { name: "YES", code: "YES" } : { name: "NO", code: "NO" }
      }
      await this.renderCards(false);
      if (this.original_phases_list === undefined) {
        this.original_phases_list = this.phases_list;
      }
      const maxPossible = this.phases_list?.length * 100;
      const overallScore = this.phases_list?.reduce((sum: number, phase: any) => sum + phase.score, 0);
      this.overAllComplainceScore = this.phases_list?.length > 0
        ? Math.round((overallScore / maxPossible) * 100)
        : 0;

      // Load all form data in parallel
      const transitionDetails = this.templateData?.transitionDetails || [];
      const phaseInfoMap = new Map(
        this.templateData?.phase_info?.map((p: any) => [p._id, p.cPhaseName])
      );

      const formDataWithSort = await Promise.all(
        transitionDetails.map(async (item: any) => {
          const phaseName = phaseInfoMap.get(item.oPhaseId);
          const findtemplate = this.templateData?.template_info?.find((val: any) => val._id === item.oTemplateId);

          const formData = await this.getTransitionFormData(item.oTemplateId, item.tollgateValues, findtemplate);
          return {
            iSortOrder: item.iSortOrder,
            phaseName,
            formData,
          };
        })
      );

      this.templateFormData = formDataWithSort
        .filter(entry => entry.formData != null)
        .sort((a, b) => a.iSortOrder - b.iSortOrder)
        .map(entry => ({
          ...entry.formData,
          phaseName: entry.phaseName,
          iSortOrder: entry.iSortOrder,
        }));
      this.originalTemplateFormData = this.templateFormData;
      console.log('this.templateFormData: ', this.templateFormData);
    } catch (error) {
      console.error("Error loading template:", error);
    }
  }

  // Optimized: Accept tollgateValues from parent to avoid redundant lookup
  async getTransitionFormData(id: any, tollgateValues: any, templateData: any): Promise<any> {
    try {

      console.log("Received transitionId:", id);

      this.templateId = id;
      this.finalUpdatedData[id] = tollgateValues ?? {};
      this.phases_table = false;
      this.showPhasesTransition = true;

      const response = { ...templateData };

      let tollgateSection: any = response?.components?.find((c: any) =>
        c?.key?.startsWith("tollgates_")
      );

      if (!tollgateSection) return null;

      /* -------------------------
         Process Tollgate Fields
      ------------------------- */

      tollgateSection?.rows?.forEach((row: any[]) => {
        row?.forEach((column: any) => {

          column?.components?.forEach((component: any) => {

            const key = component?.key;
            if (!key) return;

            const index = key.split("_")[2];

            if (this.templateData?.isActiveTransition && key !== `tollgate_commentIconBtn_${index}`) {
              component.disabled = true;
            }

            if (key === `tollgate_commentIconBtn_${index}`) {

              const count =
                this.templateData?.transition_comments?.filter((comment: any) =>
                  comment?.key === key &&
                  comment?.type === "tollgate" &&
                  comment?.oTemplateId === id
                )?.length ?? 0;

              component.leftIcon = "bi bi-chat-left-dots";
              if (count !== 0) {
                component.label = `<span class='badge-count'>${count}</span>`;
              } else {
                component.label = null;
              }
            }

            /* Default Values */

            if (this.finalUpdatedData[id]?.hasOwnProperty(key)) {

              if (key.startsWith("tollgate_score_")) {
                component.label = this.finalUpdatedData[id][key];
                component.html = this.finalUpdatedData[id][key];
              } else {
                component.defaultValue = this.finalUpdatedData[id][key];
              }

            } else {
              this.finalUpdatedData[id][key] = "";
            }

          });

        });
      });

      /* =================================================
        CUSTOMER PORTAL TRANSFORMATION
      ================================================= */

      if (this.isCustomerPortal) {

        const originalTable = tollgateSection;

        if (Array.isArray(originalTable?.rows)) {

          /* Deep copy rows */

          let newRows = originalTable.rows.map((row: any[]) =>
            row.map((column: any) => ({
              ...column,
              components: Array.isArray(column?.components)
                ? column.components.map((comp: any) => ({ ...comp }))
                : []
            }))
          );

          /* -------------------------------------------------
             STEP 1: Filter rows
          -------------------------------------------------- */

          newRows = newRows.filter((row: any[], rowIndex: number) => {

            if (rowIndex === 0) return true;

            return row.some((column: any) =>
              column.components.some((component: any) =>
              (
                component?.key?.startsWith("tollgate_portal_action_") &&
                ["client_view_only", "client_view_edit_SME", 'client_view_edit_TM'].includes(component?.defaultValue)
              )
              )
            );

          });

          /* -------------------------------------------------
             STEP 2: Enable / Disable row
          -------------------------------------------------- */

          newRows.forEach((row: any[]) => {

            // 🔥 Detect row permission FIRST
            const rowPermission = row
              .flatMap((col: any) => col.components)
              .find((comp: any) => comp?.key?.startsWith("tollgate_portal_action_"))
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
                  const isCommentBtn = key.startsWith("tollgate_commentIconBtn_");
                  component.disabled = !isCommentBtn;
                } else {
                  component.disabled = true; // ✅ FIXED
                }
              });
            });
          });
          /* -------------------------------------------------
             STEP 3: Remove portal_action columns
          -------------------------------------------------- */

          // newRows = newRows
          //   .map((row: any[]) =>
          //     row
          //       .map((column: any) => ({
          //         ...column,
          //         components: column.components.filter(
          //           (component: any) =>
          //             !component?.key?.startsWith("tollgate_portal_action_")
          //         )
          //       }))
          //       .filter((column: any) => column.components.length > 0)
          //   )
          //   .filter((row: any[]) => row.length > 0);

          /* -------------------------------------------------
             STEP 4: Remove Client Access column
          -------------------------------------------------- */

          if (newRows[0]) {

            const clientAccessIndex = newRows[0].findIndex((column: any) =>
              column.components.some((comp: any) => comp?.key === "Client Access")
            );

            if (clientAccessIndex !== -1) {

              newRows = newRows.map((row: any[]) =>
                row.filter((_: any, index: number) => index !== clientAccessIndex)
              );

            }

            /* Reorder ID column first */

            const idColumnIndex = newRows[0].findIndex((column: any) =>
              column.components.some((comp: any) => comp?.key?.startsWith("ID_"))
            );

            if (idColumnIndex > 0) {

              newRows = newRows.map((row: any[]) => {

                const idColumn = row[idColumnIndex];

                return [
                  idColumn,
                  ...row.filter((_: any, i: number) => i !== idColumnIndex)
                ];

              });

            }

          }

          /* -------------------------------------------------
             STEP 5: Assign labels (a,b,c,d)
          -------------------------------------------------- */

          const alphabet = "abcdefghijklmnopqrstuvwxyz";
          let index = 0;

          newRows.forEach((row: any[]) => {

            row.forEach((column: any) => {

              column.components.forEach((comp: any) => {

                const key = comp?.key;
                if (!key) return;

                if (key.startsWith("ID_")) {

                  const label = alphabet[index] || `a${index}`;

                  comp.label = label;
                  comp.html = label;

                  index++;

                }

              });

            });

          });

          /* -------------------------------------------------
             STEP 6: Build new table
          -------------------------------------------------- */

          const newTableComponent = {
            ...originalTable,
            rows: newRows,
            numRows: newRows.length,
            numCols: newRows[0]?.length || 0
          };

          tollgateSection = {
            ...newTableComponent
          };

        }

      }

      /* -------------------------
         Score Calculation
      ------------------------- */

      const score_data = this.phases_list?.find((item: any) => item._id === id);

      return {
        ...response,
        components: [tollgateSection],
        templateId: id,
        type: "tollgate",
        score: score_data?.score ?? 0,
        transitionId: this.templateData?._id
      };

    } catch (err) {

      console.error("Error loading form:", err);
      return null;

    }
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
    console.log("this.finalUpdatedData: ", this.finalUpdatedData);
    if (this.plannedGoLiveDate) {
      const date = new Date(this.plannedGoLiveDate);
      date.setHours(12, 0, 0, 0); // Set to 12:00:00
      this.plannedGoLiveDate = date;
    }
    this.finalUpdatedData["transitionPeriod"] = this.transitionPeriod;
    this.finalUpdatedData["plannedGoLiveDate"] = this.plannedGoLiveDate;
    const payload = {
      id: this.transitionId,
      type: "tollgate",
      templateId: this.templateId,
      updatedData: this.finalUpdatedData,
    };
    console.log("payload: ", payload);
    this.bbLoader.showLoader();
    try {
      this.transitionService.emitData("updateTransitionTemplate", payload)
    } catch (error) {
      console.log("error: ", error);
    } finally {
      this.bbLoader.hideLoader();
      // this.loadTemplate();
      this.showPhasesTransition = false;
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
  private getTableInstance(templateId: any): TransitionDataTableComponent | undefined {
    return this.transitionDataTables.find(comp => comp.formData.templateId === templateId);
  }
  async onChangeValues(event: any, templateId: any) {
    this.templateId = templateId;

    if (!event?.isModified || !event?.changed?.component?.key) return;
    console.log('event: ', event);

    // Ensure object exists
    if (!this.finalUpdatedData[templateId]) {
      this.finalUpdatedData[templateId] = {};
    }
    this.isModified = true;
    const fieldKey = event.changed.component.key;
    const fieldValue = event.changed.value;
    const index = fieldKey.split("_")[2]; // Expect format like "tollgate_actualStartDate_1"
    const statusVal = event.data[`tollgate_status_${index}`];
    let status = statusVal;
    // Store the updated value

    this.finalUpdatedData[templateId] = event.data;

    // Auto-score calculation
    // "" (cleared) → score "", "Yes" → 10, "Yes partially" → 5, "No" → 0
    if (fieldKey.startsWith("tollgate_status_")) {
      const auto_score = fieldValue === "" ? "" : fieldValue === "Yes" ? "10" : fieldValue === "Yes partially" ? "5" : "0";
      this.finalUpdatedData[templateId][`tollgate_score_${index}`] = auto_score;
    }

    // Score for UI update — "" when cleared, else numeric string
    const score = fieldValue === "" ? "" : fieldValue === "Yes" ? "10" : fieldValue === "Yes partially" ? "5" : "0";
    // Update form components without re-render
    // ✅ update only correct table instance
    const tableInstance = this.getTableInstance(templateId);
    if (tableInstance) {
      tableInstance.updateFormComponent(fieldKey, fieldValue);
      tableInstance.updateFormComponent(`tollgate_status_${index}`, status);
      if (fieldKey.startsWith("tollgate_status_")) {
        tableInstance.updateFormComponent(`tollgate_score_${index}`, score);
      }
    }
    // ---- DEBOUNCE SAVE ----
    await this.renderCards(true);
    await this.saveChanges();

  }

  private async saveChanges() {
    const isUpdateCurrentChanges = !!this.templateData?.transitionDetails?.find(
      (val: any) =>
        val.oTemplateId === this.templateId &&
        !val.tollgateValues
    );

    const payload = {
      id: this.transitionId,
      type: "tollgate",
      templateId: this.templateId,
      updatedData: this.finalUpdatedData,
      isModified: this.isModified,
      isUpdateCurrentChanges: isUpdateCurrentChanges,
      summary: this.phases_list?.map((item: any) => {
        return {
          cPhaseId: item.phase_id,
          tollgate_score: item.score
        }
      })
    };
    this.transitionService.emitData("updateTransitionTemplate", payload)
  }

  async processData(templateFormData: any[], commentsData: any[]): Promise<Record<string, any>[]> {
    const finalData: Record<string, any>[] = [];

    const companyName = `Company name: ${this.templateData?.cCompanyName || ""}`;
    const productName = `Product name: ${this.templateData?.cProductName || ""}`;

    templateFormData.forEach((section: any, sectionIndex: number) => {
      console.log('section id: ', section._id);
      const complianceScore = section.score || 0;
      const phaseName = section.phaseName
        ? `${section.phaseName} - Compliance Score: ${complianceScore}%`
        : "Untitled Phase";
      const kpiComponent = section.components?.[0];

      if (!Array.isArray(kpiComponent?.rows)) return;

      const sectionRows: Record<string, any>[] = [];
      const headers: string[] = [];

      // Extract headers from first row
      const headerRow = kpiComponent.rows[0];
      headerRow.forEach((col: any, index: number) => {
        const headerLabel = col?.components?.[0]?.label || `Column ${index + 1}`;
        headers.push(headerLabel);
      });

      // Add Company + Product
      if (sectionIndex === 0) {
        const companyProductRow: Record<string, any> = {};
        const firstHeader = headers[0];
        if (firstHeader) {
          companyProductRow[firstHeader] = companyName;
          if (headers[1]) companyProductRow[headers[1]] = productName;
          headers.slice(2).forEach(header => (companyProductRow[header] = ''));
          finalData.push(companyProductRow);
        }
      }


      // Add phase name row
      const phaseNameRow: Record<string, any> = {};
      const phaseHeader = headers[0];
      if (phaseHeader) {
        phaseNameRow[phaseHeader] = phaseName;
        headers.slice(1).forEach((header) => (phaseNameRow[header] = ""));
        sectionRows.push(phaseNameRow);
      }

      // Process data rows
      kpiComponent.rows.slice(1).forEach((row: any[], _rowIndex: number) => {
        const rowData: Record<string, any> = {};
        if (headers[0]) rowData[headers[0]] = phaseName; // always first col = phase
        row.forEach((col: any, colIndex: number) => {
          const comp = col?.components?.[0];
          if (!comp) return;

          const label = headers[colIndex];
          let value = comp.defaultValue;
          let defaultValue = comp.defaultValue;
          // 🔹 Handle portal_action select mapping
          if (comp.key.startsWith("tollgate_portal_action_")) {
            const matchedOption = comp?.data?.values?.find(
              (val: any) => val?.value === defaultValue
            );
            value = matchedOption?.label || "";
          }

          if (comp.type === "select" && (value == null || value === "")) {
            value = "";
          }



          // Handle text fields
          else if (comp.type === "textfield" || comp.type === "textfield") {
            value = value || "";
          }
          // Format date
          // else if (comp.type === 'datetime' && value != null || "") {
          else if (comp.type === 'datetime' && value && !isNaN(Date.parse(value))) {
            value = this.convertDateToDDMMYYYY(value)
            // new Date(value).toLocaleString('en-US', {
            //   month: 'numeric',
            //   day: 'numeric',
            //   year: 'numeric'
            //   // hour: '2-digit',
            //   // minute: '2-digit',
            //   // hour12: true
            // });
          }
          // Arrays to comma-separated
          else if (Array.isArray(value)) {
            value = value.join(', ');
          }
          // Handle comments (only in last column, and only for buttons)
          if (colIndex === row.length - 1 && comp.type === "button") {
            const matchingComments = commentsData
              .filter(c =>
                c.key === comp.key &&
                (!section?._id || !c.oTemplateId || section?._id === c.oTemplateId)
              )
              .map((c: { cCreatedBy: any; cComment: any; cCreatedAt: string; }) => {
                const formattedDate = this.convertDateToDDMMYYYY(c.cCreatedAt);
                //  new Date(c.cCreatedAt).toLocaleString('en-US', {
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

            value = matchingComments || "";
          }

          // else if (value == null || value === '') {
          //   value = comp.label || '';
          // }
          else if (value == null || value === '') {
            value = (comp.type === "select" || comp.type === "textfield") ? '' : (comp.label || '');
          }

          if (label) rowData[label] = value;
        });
        sectionRows.push(rowData);
      });

      finalData.push(...sectionRows);
    });

    return finalData;
  }

  async getExportContext() {
    await this.loadTemplatMapping();
    let commentsData = this.templateData?.transition_comments;
    this.exportdata = await this.processData(this.templateFormData, commentsData);
    return {
      formData: this.exportdata,
      isExporting: true,
      htmlSection: this.htmlSection,
      filename: "Tollgate_Checklist"
    };
  }

  onComplianceChange(event: any) {
    console.log('event-----------onComplianceChange: ', event);
    const checked = event?.checked?.length > 0;
    const payload = {
      type: "phases_table",
      id: this.transitionId,
      updatedData: {
        ...this.templateData?.phasesTableValues,
        overallComplianceTollGate: checked
      },
      userId: this.userId,
    };

    try {
      this.transitionService.emitData("updateTransitionTemplate", payload);
    } catch (error) {
      console.error("Error updating compliance:", error);
    }
  }

  onReadinessChange(event: any) {
    const payload = {
      type: "phases_table",
      id: this.transitionId,
      updatedData: {
        ...this.templateData?.phasesTableValues,
        goLiveReadiness: event?.value?.name || null,
      },
      userId: this.userId,
    };

    try {
      this.transitionService.emitData("updateTransitionTemplate", payload);
    } catch (error) {
      console.error("Error updating readiness:", error);
    }
  }

  updateScore(phaseName: any) {
    return this.phases_list?.find((item: any) => item.phaseName === phaseName)?.score;
  }

  updateOverallScore(field: any) {
    const maxPossible = this.phases_list?.length * 100;
    const overallScore = this.phases_list?.reduce((sum: number, phase: any) => sum + phase.score, 0);
    const score = this.phases_list?.length > 0
      ? Math.round((overallScore / maxPossible) * 100)
      : 0;
    if (field === "score") {
      return score;
    } else {
      let statusCode = 'status-red';
      if (score >= 90 && score <= 100) {
        statusCode = 'status-green';
      } else if (score >= 75 && score <= 89) {
        statusCode = 'status-orange';
      } else {
        statusCode = 'status-red';
      }
      return statusCode;

    }
  }

}
