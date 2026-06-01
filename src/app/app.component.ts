import { Component, inject } from "@angular/core";
import {
  BbLayoutMenuService,
  BBAuthService,
  BbStoreService,
  SsoService,
  BbNotificationService,
  bbaddressfinderservice,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import {
  RoleManagementService,
  PasswordsettingService,
  UserRegistrationService,
  CompanyInformationService,
  ErrorLogService,
  countryMasterService,
} from "projects/CommonLibrary-UI/BBUserAdmin-mongo/src/public-api";
import { environment } from "../../environments/environment";

import { FormsService } from "projects/BBForms-ui/src/public-api";
import { BbLayoutComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/bb-layout.component";
// import { ReportBuilderUiService } from "projects/report-builder-ui/src/lib/report-builder-ui.service";
import { ReportBuilderUiService } from "projects/CommonLibrary-UI/report-builder-ui/src/lib/report-builder-ui.service";
import { BbLogoService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/services/bb-logo.service";
import { LayoutSettingsService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/services/layout-settings.service";
import { ApplicationServiceService } from "projects/CommonLibrary-UI/BBUserAdmin-mongo/src/lib/app-management/application-service.service";
import { SignUpService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/services/signup.service";
import { CustomerService } from "projects/customer-management-ui/shared/customer/customer.service";
import { ReportService } from "projects/CommonLibrary-UI/report-builder-ui/src/lib/report/report.service";
import { Masterreport } from "projects/CommonLibrary-UI/report-builder-ui/src/lib/report/master-report/master-report.service";
import { AuditlogDetailService } from "projects/CommonLibrary-UI/BBUserAdmin-mongo/src/lib/user-log-details/audit-log-details/auditlog-detail-service.service";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { CommonModule } from "@angular/common";
import { SharepointService } from "projects/customer-management-ui/shared/sharepoint/sharepoint.service";
import { Title } from "@angular/platform-browser";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  imports: [BbLayoutComponent, CommonModule],
})
export class AppComponent {
  private bbAuthService = inject(BBAuthService);
  private bbStore = inject(BbStoreService);
  private bbLayoutMenuService = inject(BbLayoutMenuService);
  private countryMasterService = inject(countryMasterService);
  private ssoService = inject(SsoService);
  private roleManagementService = inject(RoleManagementService);
  private userRegistrationService = inject(UserRegistrationService);
  private passwordsettingService = inject(PasswordsettingService);
  private reportBuilder = inject(ReportBuilderUiService);
  private formservice = inject(FormsService);
  private companyInformationService = inject(CompanyInformationService);
  private errorLogService = inject(ErrorLogService);
  private imageService = inject(BbLogoService);
  private bbLayoutSettingService = inject(LayoutSettingsService);
  private applictionService = inject(ApplicationServiceService);
  private signupService = inject(SignUpService);
  private bbNotificationService = inject(BbNotificationService);
  private customerService = inject(CustomerService);
  private ReportService = inject(ReportService);
  private masterReport = inject(Masterreport);
  private auditLogsService = inject(AuditlogDetailService);
  private router = inject(Router);
  private titleService = inject(Title);
  private bbaddressfinderservice = inject(bbaddressfinderservice);
  private sharepointService = inject(SharepointService);

  title = "customer-management-ui";

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const isTaskList = event.url.includes("/task/list") || event.url.includes("/ticket/viewtask");

        this.isTaskListRoute = isTaskList;

        if (isTaskList) {
          this.bbStore.setItem("isFrom", "crm");
          this.bbStore.setItem("isFromCRM", "crm");
        }
      });
  }
  isTaskListRoute = false;
  ngOnInit() {
    if (environment.title) {
      this.titleService.setTitle(environment.title);
    } else {
      this.titleService.setTitle("CRM");
    }
    this.formservice.collectionId = environment.reportServiceCollectionId;
    this.bbStore.secretKey = environment.cryptoKey;
    this.signupService.crmUrl = environment.crmProductsUrl;
    this.bbAuthService.authServiceUrl = environment.mongo_AuthServiceURL + "/auth";
    this.bbAuthService.api_url = environment.mongo_AuthServiceURL;
    this.applictionService.apiURL_Mongo = environment.mongo_AuthServiceURL;
    this.imageService.logoserviceURL = environment.mongo_AuthServiceURL + "/logo";
    this.roleManagementService.apiURL = environment.mongo_AuthServiceURL;
    this.bbAuthService.layoutSetting = environment.layoutSetting;
    this.bbLayoutSettingService.themeSettings = environment.themeSetting;
    this.userRegistrationService.apiURL_Mongo = environment.mongo_AuthServiceURL;
    this.passwordsettingService.apiURL = environment.mongo_AuthServiceURL;
    this.bbLayoutMenuService.authServiceUrl = environment.mongo_AuthServiceURL + "/auth";
    this.countryMasterService.mongoApiURL = environment.mongo_AuthServiceURL;
    this.companyInformationService.apiURL_Mongo =
      this.bbStore.getItem("Origin") === "App" && environment.projectName === "crm"
        ? environment.mongo_common_AuthServiceURL
        : environment.mongo_AuthServiceURL;
    this.bbAuthService.fileStorageAccessKey = environment.ACCESS_KEY;
    this.bbLayoutMenuService.bbauthServiceUrl = environment.mongo_AuthServiceURL;
    this.bbLayoutSettingService.authServiceUrl = environment.mongo_AuthServiceURL;
    this.bbLayoutMenuService.api_url_central = environment.mongo_AuthServiceURL_commonAuth;
    this.bbAuthService.api_url_default = environment.mongo_AuthServiceURL_commonAuth + "/auth";

    this.reportBuilder.reportBuilderApiUrl = environment.report_builder_apiUrl;
    this.formservice.formServiceURL = environment.mongo_FormServiceURL;
    this.bbAuthService.changePasswordUrl = "api/resetPwd";
    this.bbAuthService.loginUrl = "/login";
    this.bbLayoutMenuService.menuItemUrl = "/getMainMenu";
    this.bbAuthService.enableSSO = environment.enableSSO;
    this.ssoService.oktaServiceUrl = environment.ssoServiceUrl + "/api/okta";
    this.ssoService.pingServiceUrl = environment.ssoServiceUrl + "/api/ping";
    this.reportBuilder.formServiceURL = environment.mongo_FormServiceURL;
    this.reportBuilder.jsonUrl = environment.jsonUrl;
    this.reportBuilder.collectionId = environment.reportServiceCollectionId;
    this.errorLogService.authServiceURL = environment.mongo_FormServiceURL;
    this.bbAuthService.projectName = environment.projectName;
    this.bbAuthService.common_service_apiURL = environment.mongo_AuthServiceURL + "/commonService";
    this.bbAuthService.recaptchaV3SiteKey = environment.recaptchaV3SiteKey;
    this.bbAuthService.recaptchaV2SiteKey = environment.recaptchaV2SiteKey;
    this.bbAuthService.recaptchaV2URL = environment.recaptchaV2URL;
    // this.bbAuthService.fileStorageAccessKey = environment.ACCESS_KEY;
    // this.bbAuthService.serviceUrl = environment.mongo_AuthServiceURL_Central;
    this.bbAuthService.ipAddressUrl = environment.ipAddressUrl;
    this.bbAuthService.api_url_default = environment.mongo_common_AuthServiceURL + "/auth";
    this.bbLayoutMenuService.projectName = environment.projectName;
    this.bbAuthService.standAloneApp = environment.standAloneApp;
    this.bbLayoutMenuService.standAloneApp = environment.standAloneApp;
    this.bbNotificationService.apiURL_Mongo = environment.mongo_AuthServiceURL;
    this.customerService.contractId = environment.status_contracting;
    this.customerService.DocumentEndStatus = environment.status_DocumentEnd;
    this.customerService.prospectId = environment.status_prospect;
    this.customerService.activeId = environment.status_active;
    this.customerService.inactiveId = environment.status_inactive;
    this.customerService.transitionId = environment.status_transition;
    this.customerService.recategoryid = environment.recategoryid;
    // this.roleManagementService.ticketingUrl = environment.ticketingArticleUrl;
    // this.roleManagementService.ticketingAppUrl = environment.ticketkingAppUrl;
    this.ReportService.reportBuilderApiUrl = environment.report_builder_apiUrl;
    this.masterReport.reportBuilderApiUrl = environment.report_builder_apiUrl;
    this.sharepointService.fileStorageServiceUrl = environment.fileStorageApiUrl;
    this.auditLogsService.auditLogUrl = environment.audit_logUrl;
    this.bbAuthService.enableSignup = environment.enableSingup;
    this.bbLayoutMenuService.standAloneApp = environment.standAloneApp;
    this.bbLayoutMenuService.projectName = environment.projectName;
    this.bbLayoutMenuService.standAloneApp = environment.standAloneApp;
    this.bbaddressfinderservice.cenauthServiceUrl = environment.mongo_AuthServiceURL_commonAuth;
    this.roleManagementService.reportBuilder = environment.report_builder_apiUrl;
    this.bbStore.setItem("dateFormatkey", 'MM/DD/YYYY');

  }
}
