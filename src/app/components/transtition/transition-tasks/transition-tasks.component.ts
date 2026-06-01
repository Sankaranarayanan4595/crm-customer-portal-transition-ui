import { Component, OnInit, inject } from "@angular/core";
import { Dialog } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { TableModule } from "primeng/table";
import { CommonModule } from "@angular/common";
import { firstValueFrom } from "rxjs";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import { BBLoaderService, BBToastService, DataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { FloatLabelModule } from "primeng/floatlabel";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { Router } from "@angular/router";
import { CsatSurveyComponent } from "../csat/csat-survey/csat-survey.component";
import { CsatScoreComponent } from "../csat/csat-score/csat-score.component";
// import { NgSelectModule } from "@ng-select/ng-select";
import { TextareaModule } from 'primeng/textarea';
import { AccordionModule } from "primeng/accordion";
import { ChartModule } from "primeng/chart";
// import { Knob } from "primeng/knob";
import { ProgressBarModule } from 'primeng/progressbar';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DynamicHeightDirective } from "../../sharedUI/directives/dynamic-height.directive";
import { Checkbox } from 'primeng/checkbox';
const transition = "transition";
@Component({
  selector: "app-transition-tasks",
  imports: [
    Dialog,
    ButtonModule,
    AccordionModule,
    InputTextModule,
    SelectModule,
    TableModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    FloatLabelModule,
    CsatScoreComponent,
    CsatSurveyComponent,
    DataTableComponent,
    TextareaModule,
    ChartModule,
    Tag,
    ProgressBarModule, TooltipModule, DynamicHeightDirective, InputTextModule, Checkbox
  ],
  templateUrl: "./transition-tasks.component.html",
  styleUrl: "./transition-tasks.component.scss",
})
export class TransitionTasksComponent implements OnInit {
  private fb = inject(FormBuilder);
  private transitionService = inject(TransitionService);
  private bbLoader = inject(BBLoaderService);
  private bbToaster = inject(BBToastService);
  private profileService = inject(CategoriesService);
  private router = inject(Router);

  visible: boolean = false;
  visibleBegin: boolean = false;
  showcsatScore: boolean = false;
  phaseProcessForm!: FormGroup;
  showcsatSurvey: boolean = false;
  taskForm!: FormGroup;
  processForm!: FormGroup;
  ExistingTaskList: any = [];
  transition_managers: any;
  transition_manager: any;
  mapped_transition_phases: any;
  mapped_phases: any;
  updateMapping: any;
  summaryChart: any;
  oTask_Id: any;
  transitionSelection: any;
  transitionId: any = null;
  surveyMappedId: any;
  phases: any;
  templates: any;
  currentMappedID: any;
  currentcattID: any;
  mappedPhaseTemplateData: any[] = [];
  listItemsMappedPhasesTemplates: any[] = [];
  showModal: boolean = false;
  isMappedEdited: boolean = false;
  isEditMode: boolean = false;
  phasesMappingTemplateForm!: FormGroup;
  basicData: any;
  basicOptions: any;
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

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  visibleChecklistDialog: boolean = false;
  selectedChecklist: any[] = [];

  showChecklistDialog(task: any) {
    this.selectedChecklist = task.summary || [];
    this.visibleChecklistDialog = true;
  }


  async ngOnInit() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
    const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

    this.basicData = {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [
        {
          label: 'Sales',
          data: [80, 20, 10, 25],
          backgroundColor: [
            'rgba(249, 115, 22, 0.2)',
            'rgba(6, 182, 212, 0.2)',
            'rgb(107, 114, 128, 0.2)',
            'rgba(139, 92, 246, 0.2)',
          ],
          borderColor: ['rgb(249, 115, 22)', 'rgb(6, 182, 212)', 'rgb(107, 114, 128)', 'rgb(139, 92, 246)'],
          borderWidth: 1,
        },
      ],
    };

    this.basicOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
    };
    this.showcsatScore = false;
    this.showcsatSurvey = false;
    this.phasesMappingTemplateForm = this.fb.group({
      cPhaseName: [null],
      cTemplateName: [null],
      cSortOrder: [1],
    });
    this.phaseProcessForm = this.fb.group({
      cGroupName: ["", Validators.required],
      cDescription: ["", Validators.required],
      bActive: [false],
    });
    this.taskForm = this.fb.group({
      cTaskDescription: ["", [
        Validators.required,
        Validators.maxLength(250),
        Validators.pattern(/^(?!\s*$).+/) // not only whitespace
      ]],
      cTaskName: ["", [
        Validators.required,
        Validators.maxLength(250),
        Validators.pattern(/^(?!\s*$).+/) // not only whitespace
      ]],
    });
    this.processForm = this.fb.group({
      transition_manager: ["", [Validators.required]],
      mapped_phases: ["", [Validators.required,
      ]],
    });

    await Promise.all([
      this.loadPhase(),
      this.loadMappedPhasesTemplates(),
      this.loadUsers(),
      this.loadTransitionTemplates(),
      this.loadTransitionTasks(),
    ]);
  }
  recive_data_Mapped_Phases_Templates(data: any) {
    if (data.type == "delete") {
      this.deleteMappedData(data.data);
    } else if (data.type == "edit") {
      this.editMappedData(data.data);
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


  deleteMappedData(data: any) {
    const indexToDelete = data._id.index;

    this.mappedPhaseTemplateData.splice(indexToDelete, 1);

    this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item: { phase: { cPhaseName: any; }; template: { cTemplateName: any; }; sortOrder: any; }, index: any) => ({
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

  async loadPhase() {
    try {
      this.bbLoader.showLoader();
      const phase: any = await firstValueFrom(this.transitionService.getAllBActivePhases());
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
      const temp = await firstValueFrom(this.transitionService.getAllTransitionTemplates());
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

  async loadTransitionTasks() {
    try {
      const response = await firstValueFrom(this.transitionService.getAllTransitionTasks());
      const bgColors = [
        "rgba(139, 139, 139, 0.2)",
        "rgba(6, 182, 212, 0.2)",
        "rgba(107, 114, 128, 0.2)",
        "rgba(139, 92, 246, 0.2)",
      ];

      const borderColors = [
        "rgb(249, 115, 22)",
        "rgb(6, 182, 212)",
        "rgb(107, 114, 128)",
        "rgb(139, 92, 246)",
      ];

      this.ExistingTaskList = response?.data?.map((item: any) => {
        if (item?.summary?.length > 0) {
          const summary = item?.summary?.map((sum: any) => {
            const phase = this.phases?.find((val: any) => val._id === sum.cPhaseId);
            return {
              ...sum,
              phaseName: phase?.cPhaseName || "Unknown Phase",

            };
          }) ?? [];

          // assign colors based on index
          const colors = summary.map((_: any, i: number) => ({
            bg: bgColors[i % bgColors.length],
            border: borderColors[i % borderColors.length],
          }));

          return {
            ...item,
            summary,
            checklist_chart: {
              labels: summary.map((val: any) => val.phaseName),
              datasets: [
                {
                  label: "Transition Checklist",
                  data: summary.map((val: any) => val.checklist_score),
                  backgroundColor: colors.map((c: { bg: any; }) => c.bg),
                  borderColor: colors.map((c: { border: any; }) => c.border),
                  borderWidth: 1,
                },
              ],
            },
            kpi_chart: {
              labels: summary.map((val: any) => val.phaseName),
              datasets: [
                {
                  label: "KPI Checklist",
                  data: summary.map((val: any) => val.kpi_score),
                  backgroundColor: colors.map((c: { bg: any; }) => c.bg),
                  borderColor: colors.map((c: { border: any; }) => c.border),
                  borderWidth: 1,
                },
              ],
            },
            tollgate_chart: {
              labels: summary.map((val: any) => val.phaseName),
              datasets: [
                {
                  label: "Tollgate Checklist",
                  data: summary.map((val: any) => val.tollgate_score),
                  backgroundColor: colors.map((c: { bg: any; }) => c.bg),
                  borderColor: colors.map((c: { border: any; }) => c.border),
                  borderWidth: 1,
                },
              ],
            },
            summaryChart: {
              labels: summary.map((s: { phaseName: any; }) => s.phaseName),
              datasets: [
                {
                  label: 'Checklist',
                  data: summary.map((s: { checklist_score: any; }) => s.checklist_score),
                  backgroundColor: '#3B82F6', borderColor: colors.map((c: { border: any; }) => c.border),
                  borderWidth: 1,
                },
                {
                  label: 'KPI',
                  data: summary.map((s: { kpi_score: any; }) => s.kpi_score),
                  backgroundColor: '#10B981', borderColor: colors.map((c: { border: any; }) => c.border),
                  borderWidth: 1,
                },
                {
                  label: 'Tollgate',
                  data: summary.map((s: { tollgate_score: any; }) => s.tollgate_score),
                  backgroundColor: '#F59E0B',
                  borderColor: colors.map((c: { border: any; }) => c.border),
                  borderWidth: 1,
                }
              ]
            }

          };
        } else {
          return item;
        }
      }) ?? [];

      console.log('this.ExistingTaskList: ', this.ExistingTaskList);
    } catch (error) {
      console.log("error: ", error);
    }
  }
  onChangeTaskComponent(event: any) {
    const value = event?.value;
    console.log(value);
    this.ngOnInit();
  }

  csatScore(surveyMappedId: any) {
    this.surveyMappedId = surveyMappedId;
    this.showcsatScore = true;
  }

  showProductsFn() {
    this.taskForm.reset();
    this.visible = true;
  }
  logFormValidationErrors() {
    Object.keys(this.taskForm.controls).forEach((key) => {
      const controlErrors = this.taskForm.get(key)?.errors;
      if (controlErrors) {
        this.taskForm.get(key)?.markAsTouched();
      }
    });
  }
  onCancelTaskModal() {
    // this.visible = false;
    this.taskForm.reset();
  }
  async onSaveTasks() {
    try {
      if (!this.taskForm.valid) {
        this.logFormValidationErrors();
        // this.bbToaster.show_error("Please enter required fields");
        return;
      }
      this.bbLoader.showLoader();
      const payload = this.taskForm.value;
      const response = await firstValueFrom(this.transitionService.createTransitionTask(payload));
      if (response?.success) {
        this.bbToaster.show_success(response?.message);
      } else {
        this.bbToaster.show_warn(response?.message);
      }
      await this.loadTransitionTasks();
      this.bbLoader.hideLoader();
      this.visible = false;
      this.taskForm.reset();
    } catch (error) {
      console.log('error: ', error);
    }
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

  onCancelBeingTransistion() {
    this.transition_manager = null;
    this.mapped_phases = null;
    this.visible = false;
    this.processForm.reset();
  }

  onChangeTransition(event: any, field: string) {
    if (field === "manager") {
      this.transition_manager = event?.value;
    } else {
    }
  }

  async csatSurvey(productId: any, transitionId: any) {
    const response = await firstValueFrom(this.transitionService.checkTransitionComplete(transitionId));
    this.transitionId = { transitionId, productId };
    if (response?.data?.isTranstion) {
      this.showcsatSurvey = true;
    } else {
      this.bbToaster.show_warn("Please complete the transition before proceeding");
    }
  }

  onChangeMappedTransition(event: any, field: string) {
    if (field === "group") {
      this.mapped_phases = event?.value;
    } else {
    }
  }

  async loadMappedPhasesTemplates() {
    try {
      const mappedPhaseTemplate = await firstValueFrom(this.transitionService.getAllPhasesTemplatesBActiveMasterMapped());
      if (mappedPhaseTemplate.success) {
        this.mapped_transition_phases = mappedPhaseTemplate.data;
      } else {
        this.mapped_transition_phases = mappedPhaseTemplate.data = [];
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }
  async loadUsers() {
    try {
      this.transition_managers = await this.profileService.getUsers();
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }
  logFormValidationProcessErrors() {
    Object.keys(this.processForm.controls).forEach((key) => {
      const controlErrors = this.processForm.get(key)?.errors;
      if (controlErrors) {
        this.processForm.get(key)?.markAsTouched();
      }
    });
  }

  async onSaveBeingTransitioning() {

    if (!this.processForm.valid) {
      this.logFormValidationProcessErrors();
      // this.bbToaster.show_error("Please enter required fields");
      return;
    }
    try {
      this.bbLoader.showLoader();
      const transitionDetails = this.transitionSelection?.map((value: any, index: number) => {
        return {
          iSortOrder: value?.iSortOrder ?? index + 1,
          oTemplateId: value?.oTemplateId,
          oPhaseId: value?.oPhaseId,
        };
      });
      const value = this.processForm.value;
      const payload = {
        oTask_Id: this.oTask_Id,
        transitionDetails,
        transition_manager: value.transition_manager,
        mappedPhaseTemplate_Id: value.mapped_phases,
      };
      const data = await firstValueFrom(this.transitionService.beginTransitionMapWithProduct(payload));
      if (data?.success) {
        this.bbToaster.show_success("Transition saved successfully");
        this.transitionSelection = [];
        this.ngOnInit();
        this.processForm.reset();
      }
      this.bbLoader.hideLoader();
      this.visibleBegin = false;
    } catch (error) {
      console.log("error: ", error);
    }
  }
  showDialog(id: any) {
    this.transition_manager = null;
    this.mapped_phases = null;
    this.oTask_Id = id;
    this.visibleBegin = true;
    this.showModal = false;
    this.phaseProcessForm.reset();
    this.phasesMappingTemplateForm.reset();
  }

  async onMovetoTransitionDashboard(_id: any) {
    console.log('_id: ', _id);
    this.router.navigate([`/${transition}/view-transition`], { state: { _id: _id?.transitionId, transition_completed: _id?.transition_completed, task_details: _id } });
  }
  addProcess() {
    // this.visibleBegin = false;
    this.showModal = true;
    this.phaseProcessForm.reset();
    this.phasesMappingTemplateForm.reset();

  }

  closeModal() {
    this.showModal = false;
    // this.visibleBegin = true;
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

      if (this.mappedPhaseTemplateData?.some((item: { phase: { _id: any; }; }) => item.phase._id === selectedPhase._id)) {
        this.bbToaster.show_warn("This phase is already mapped to a template.");
        return;
      }

      if (
        formValue.cSortOrder !== null &&
        formValue.cSortOrder !== undefined &&
        this.mappedPhaseTemplateData?.some((item: { sortOrder: any; }) => item.sortOrder === formValue.cSortOrder)
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

      this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData?.map((item: { phase: { cPhaseName: any; }; template: { cTemplateName: any; }; sortOrder: any; }, index: any) => ({
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
          (item: { phase: { _id: any; }; }, index: any) => index !== this.currentMappedID && item.phase._id === selectedPhase._id
        )
      ) {
        this.bbToaster.show_warn("This phase is already mapped to another template.");
        return;
      }

      const duplicateSortOrder = this.mappedPhaseTemplateData.some(
        (item: { sortOrder: any; }, index: any) => index !== this.currentMappedID && item.sortOrder === formValue.cSortOrder
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

      this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item: { phase: { cPhaseName: any; }; template: { cTemplateName: any; }; sortOrder: any; }, index: any) => ({
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
  clearMainForm() {
    this.showModal = false;
    this.mappedPhaseTemplateData = [];
    this.listItemsMappedPhasesTemplates = [];
    this.isEditMode = false;
    this.phasesMappingTemplateForm.reset();
    this.processForm.reset();
  }

  async savePhasesTemplateMasterMapping() {
    try {
      if (!this.phaseProcessForm.valid) {
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
        cGroupName: this.phaseProcessForm.get("cGroupName")?.value?.trim(),
        cDescription: this.phaseProcessForm.get("cDescription")?.value?.trim(),
        bActive: this.phaseProcessForm.get("bActive")?.value,
        isEdited: this.isEditMode,
        editedID: this.currentcattID,
      };
      console.log("payload: ", payload);

      const data = await firstValueFrom(this.transitionService.savePhasesTemplateMasterMapping(payload));

      if (data?.success) {
        this.bbToaster.show_success(
          this.isEditMode ? "Updated Successfully" : "Saved Successfully"
        );

        this.showModal = false;
        this.mappedPhaseTemplateData = [];
        this.listItemsMappedPhasesTemplates = [];
        this.phasesMappingTemplateForm.reset({ cSortOrder: 1 });
        this.phaseProcessForm.reset();
        this.isEditMode = false;
        this.mapped_phases = data?.data?._id;
        this.loadMappedPhasesTemplates()
      }
    } catch (error) {
      console.error("Error saving phases-template mapping:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  editProcess() {
    // this.visibleBegin = false;
    this.showModal = true;
    const currentcattID = this.mapped_phases;
    this.currentcattID = currentcattID;
    if (!currentcattID) {
      this.bbToaster.show_warn("Invalid ID. Cannot edit item.");
      return;
    }
    const findData = this.mapped_transition_phases?.find((item: any) => item._id === this.mapped_phases);
    this.isEditMode = true;
    this.showModal = true;

    this.phaseProcessForm.patchValue({
      bActive: findData.bActive,
      cGroupName: findData.cGroupName,
      cDescription: findData.cDescription,
    });

    this.mappedPhaseTemplateData = findData.transitionDetails.map((detail: any) => {
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
        },
        sortOrder: detail.iSortOrder,
      };
    });

    this.listItemsMappedPhasesTemplates = this.mappedPhaseTemplateData.map((item, index) => ({
      "Phase Name": item.phase.cPhaseName,
      "Template Name": item.template.cTemplateName,
      "Sort Order": item.sortOrder,
      _id: { index },
    }));
  }
  onCancelProcess() {
    this.showModal = false;
    this.mappedPhaseTemplateData = [];
    this.listItemsMappedPhasesTemplates = [];
  }
  private readonly GREEN = '#00AB55';
  private readonly ORANGE = '#FF6D00';
  private readonly RED = '#8C0000';
  private readonly GREY = '#e0e0e0';

  sanitizeScore(score?: number): number {
    const s = Number(score ?? 0);
    return Math.max(0, Math.min(100, s));
  }

  // For Checklist & KPI
  getChecklistKpiColor(score?: number): string {
    const s = Number(score ?? 0);
    if (s === 100) return this.GREEN;       // exactly 100
    if (s > 0) return this.ORANGE;       // 1..99
    return this.GREY;                       // 0 or invalid
  }

  // For Tollgate
  getTollgateColor(score?: number): string {
    const s = Number(score ?? 0);
    if (s >= 90) return this.GREEN;
    if (s >= 75 && s <= 89) return this.ORANGE;
    return this.RED;
  }
}
