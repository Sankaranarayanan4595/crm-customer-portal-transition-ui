import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { FormioBaseComponent, FormioModule } from "@formio/angular";
import { TransitionService } from "projects/customer-management-ui/shared/transition/transition.service";
import { firstValueFrom } from "rxjs";
import { BBLoaderService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";

@Component({
  selector: "app-csat-response",
  standalone: true,
  imports: [CommonModule, FormsModule, FormioModule, DialogModule, ButtonModule],
  templateUrl: "./csat-response.component.html",
  styleUrls: ["./csat-response.component.scss"],
})
export class CsatResponseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(TransitionService);
  private bbLoader = inject(BBLoaderService);
  private bbToaster = inject(BBToastService);

  surveyMappedId!: string;
  surveyData: any;
  loading = true;
  error: string | null = null;
  selectedSurveyTemplate: any;
  formioInstance: any;
  surveySuccessForm: boolean = false;
  finalUpdatedData: { [key: string]: any } = {};
  recipientEmail!: string;
  templateId!: string;
  isSubmitted: boolean = false;
  showSrveyModal: boolean = false;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }
  startTime: any;
  async ngOnInit() {
    this.startTime = new Date();
    this.surveyMappedId = this.route.snapshot.paramMap.get("surveyMappedId")!;
    this.recipientEmail = this.route.snapshot.queryParamMap.get("recipient") || "";
    this.templateId = this.route.snapshot.queryParamMap.get("template") || "";
    await this.loadSurvey();
  }

  async loadSurvey(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      this.loading = true;
      this.error = null;

      const surveyResponse = await firstValueFrom(
        this.surveyService.getValueMappedSurveybyId(
          this.surveyMappedId,
          this.templateId
        )
      );

      console.log("surveyResponse:", surveyResponse);

      if (!surveyResponse?.success) {
        throw new Error(surveyResponse?.message || "Failed to load survey");
      }

      const surveyDetails = surveyResponse.data;

      /* ===================== CHECK ALREADY SUBMITTED ===================== */

      const userResponse = surveyDetails?.recipients_response?.find(
        (r: any) =>
          r.email === this.recipientEmail &&
          r.cSurveyTemplateId === this.templateId
      );

      this.isSubmitted = userResponse?.isSubmitted ?? false;
      if (this.isSubmitted) {
        this.showSrveyModal = false;
        return;
      }

      /* ===================== GET TEMPLATE DETAILS ===================== */

      const templateDetail = surveyDetails?.SurveyDetails?.find(
        (val: any) => val.cSurveyTemplateId === this.templateId
      );

      if (!templateDetail?.SurveyValues) {
        throw new Error("Survey data not found or invalid structure");
      }

      const surveyValues = templateDetail.SurveyValues;

      /* ===================== 🔥 UPDATE FORM.IO VALUES ===================== */

      const companyName =
        surveyDetails?.companyDetails?.company_name || "";

      const today = new Date();

      const updateSurveyValues = (values: any[]) => {
        values.forEach((section) => {
          if (!section.rows?.length) return;

          section.rows.forEach((row: any[]) => {
            row.forEach((column) => {
              if (!column.components?.length) return;

              column.components.forEach((comp: any) => {
                if (comp.key === "survey_client") {
                  comp.defaultValue = companyName;
                  comp.disabled = true;
                  this.finalUpdatedData[comp.key] = companyName;
                }

                if (comp.key === "survey_SurveyDate") {
                  comp.defaultValue = today;
                  comp.disabled = true;
                  this.finalUpdatedData[comp.key] = today;

                }
              });
            });
          });
        });
      };

      updateSurveyValues(surveyValues);

      /* ===================== PREPARE FORM ===================== */

      this.selectedSurveyTemplate = {
        surveyName: templateDetail.cSurveyName,
        cSurveyDescription: templateDetail?.cSurveyDescription,
        display: "form",
        components: surveyValues,
      };

      this.surveyData = {
        _id: surveyDetails._id,
        oActivation_Id: surveyDetails.oActivation_Id,
        oCompanyId: surveyDetails.oCompanyId,
        templateId: templateDetail.oTemplateId,
        surveyValues: surveyValues,
        cSurveyTemplateId: templateDetail?.cSurveyTemplateId,
      };

      this.showSrveyModal = true;
    } catch (error) {
      console.error("Error loading survey:", error);
      this.error = "Failed to load survey. Please try again later.";
      this.bbToaster.show_error(this.error);
    } finally {
      this.loading = false;
      this.bbLoader.hideLoader();
    }
  }

  onFormChange(event: any) {
    if (event?.isModified && event?.changed?.component?.key) {
      const key = event.changed.component.key;
      const value = event.changed.value;

      this.finalUpdatedData[key] = value;
    }
  }

  customEvent(_event: object) { }

  onFormReady(event: FormioBaseComponent) {
    this.formioInstance = event;
  }

  onFormRendered() { }

  async onFormSubmit(_submission: any) {
    try {
      this.bbLoader.showLoader();

      const payload = {
        surveyMappingId: this.surveyMappedId,
        activationId: this.surveyData.oActivation_Id,
        templateId: this.surveyData.templateId,
        responses: this.finalUpdatedData,
        recipientEmail: this.recipientEmail,
        startTime: this.startTime,
        endTime: new Date(),
        cSurveyTemplateId: this.surveyData?.cSurveyTemplateId
      };

      const response = await firstValueFrom(this.surveyService.submitSurveyResponse(payload));

      if (response?.success) {
        this.selectedSurveyTemplate = null;
        this.surveySuccessForm = true;
        this.showSrveyModal = false;
        this.bbToaster.show_success("Survey response submitted successfully!");
      } else {
        throw new Error(response?.message || "Failed to save response");
      }
    } catch (err) {
      console.error("Error submitting survey:", err);
      this.bbToaster.show_error("Failed to submit survey response. Please try again.");
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  redirectToHome() {
    this.surveySuccessForm = false;
    this.isSubmitted = false;
    this.router.navigate(["/"]);
  }
}
