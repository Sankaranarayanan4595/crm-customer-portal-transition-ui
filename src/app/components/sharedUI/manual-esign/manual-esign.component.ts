import { Component, ElementRef, ChangeDetectorRef, EventEmitter, Input, OnInit, Output, QueryList, Renderer2, ViewChildren, inject } from "@angular/core";

import {
  BBToastService,
  BBLoaderService,
  BbStoreService,
  DateRangePickerComponent,
  DataTableComponent,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import moment from "moment";
// import { CustomerDashboardComponent } from "../../adminPortal/customer-dashboard/customer-dashboard.component";
import { firstValueFrom } from "rxjs";
import { CategoriesService } from "../../../../../shared/categories/categories.service";
import { CustomerService } from "../../../../../shared/customer/customer.service";
import { NgxDropzoneModule } from "ngx-dropzone";
import { SharepointService } from "projects/customer-management-ui/shared/sharepoint/sharepoint.service";
import { MastersService } from "projects/customer-management-ui/shared/masters/masters.service";
import { DocumentTypeName } from "projects/customer-management-ui/shared/interface/masterInterface";
import { NgSelectComponent, NgSelectModule } from "@ng-select/ng-select";

import { CommonModule } from "@angular/common";
import * as mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import Tesseract from "tesseract.js";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { ViewChild } from "@angular/core";
import { DocubeeService } from "projects/customer-management-ui/shared/docubee/docubee.service";
// import { DomSanitizer } from "@angular/platform-browser";
import { HtmlPreviewComponent } from "../html-preview/html-preview.component";
import { IDropdownSettings } from "ng-multiselect-dropdown";
import { RolesData } from "projects/customer-management-ui/shared/interface/masterInterface";
import { MessagetransferService } from "projects/customer-management-ui/shared/message/messagetransfer.service";
import { SelectModule } from "primeng/select";
import { DatePicker } from "primeng/datepicker";
import { FloatLabel } from "primeng/floatlabel";
import { TableModule } from "primeng/table";
import { FileUploadModule } from "primeng/fileupload";
import { Button } from "primeng/button";
@Component({
  selector: "app-manual-esign",
  imports: [
    SelectModule,
    DatePicker,
    FloatLabel,
    NgxDropzoneModule,
    NgSelectModule,
    CommonModule,
    FormsModule,
    HtmlPreviewComponent,
    DateRangePickerComponent,
    ReactiveFormsModule,
    FileUploadModule,
    DataTableComponent,
    TableModule,
    Button,
  ],
  templateUrl: "./manual-esign.component.html",
  styleUrl: "./manual-esign.component.scss",
})
export class ManualEsignComponent implements OnInit {
  private element = inject(ElementRef);
  private renderer = inject(Renderer2);
  private categoryService = inject(CategoriesService);
  private ocustomerService = inject(CustomerService);
  private bbToaster = inject(BBToastService);
  private sharePoint = inject(SharepointService);
  private masterService = inject(MastersService);
  private bbLoader = inject(BBLoaderService);
  private BbStoreService = inject(BbStoreService);
  private docubee = inject(DocubeeService);
  // private sanitizer = inject(DomSanitizer);
  private bbStore = inject(BbStoreService);
  private cdRef = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  private osharepoint = inject(SharepointService);
  private MessagetransferService = inject(MessagetransferService);

  // @ViewChild('dueDatePicker') dueDatePickers:DatePickerSingleComponent;
  // effectiveDate: any;
  // endDate: any;
  files: any[] = [];
  esignFilesDetails: any[] = [];
  showEditEsign: boolean = false;
  @Input() showManualPage: boolean = true;
  @ViewChild("documentRow")
  documentRows!: QueryList<ElementRef>;
  @ViewChild("DocumentType") DocumentType!: NgSelectComponent;
  selectedProductType: any = null;
  filestatus: boolean = true;
  docubeeList: any;
  isChecked!: false;
  savedproducts: any;
  customtempid: any;
  iframeSrc: any;
  queue!: boolean | false;
  templates: any;
  templateid: any;
  AnchorStrings: any[] = [];
  productlistmodel: any[] = [];
  defDateFormat: any;
  manageDocument: boolean = true;
  @Input()
  companyId!: string;
  @Input()
  skipValueProducts!: boolean;
  id: any;
  userId!: string;
  compID!: string;
  isEditMode = false;
  editIndex: number | null = null;
  @ViewChild("CategoerySelect")
  CategoerySelect!: NgSelectComponent;
  @ViewChild("CategoeryAgainstProductSelect")
  CategoeryAgainstProductSelect!: NgSelectComponent;
  PreviewDocument: any;
  productstatus: any[] = [];
  selectedDocumentTypeId!: string;
  @ViewChild("templateName") templateName!: ElementRef;

  isModal: boolean = false;
  selectedCompany: string[] = [];
  tempdocuments: any;
  docuploadid: any;
  // closeViewModal(event: boolean) {
  //   this.showViewDocModal = event;
  // }
  // userForm: FormGroup;
  @Input() hideContent: boolean = false;
  @Input() showExecuteContract: any;
  @Output() cancelExecutedContracts = new EventEmitter<void>();
  @Output() onReloadContract = new EventEmitter<void>();

  FieldSet: FormGroup;
  listItems: any[] = [];
  tempData: any[] = [];
  height!: number;
  width!: number;
  // docubeeList: any[] = [];
  rolesData: any;
  templateNameExists!: boolean;
  // PreviewDocument: { fileBlob: Blob; fileName: any; templateName: any };
  showViewDocModal: boolean = false;
  dropzoneHtml: any;
  categories: any[] = [];
  products: any[] = [];
  companyList: any[] = [];
  // userId: string = this.bbStore.getItem("userId") || this.bbStore.getItem("userid");
  dropdownSetting: IDropdownSettings = {};
  userdropdownSetting: IDropdownSettings = {};
  // files: any[] = [];
  hideFieldSet: boolean = true;
  uploadDocumentID!: string;
  editmode!: boolean;
  defaultanchorstrings: any;
  DefaultAnchorStrings: any;
  defaultEsign: any;
  // compID: string = this.bbStore.getItem("selectedCompanyId");
  @ViewChildren("checkbox") checkboxes!: QueryList<ElementRef>;
  docuemntTypeID: any;
  extrctedcontent!: string;
  receivedDocumentListData!: any[];
  showManualTabHide: boolean = true;
  hideTemplateTable: boolean = true;
  editfromdetails: boolean = false;
  documentdetails: any;
  extractedContent: string = "";
  cachedDocumentContent: string = "";
  @Input() prodDataAccDashboard: any;
  @Input() UpdateProductsAccDashboard: any;
  selectedCategory: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.FieldSet = this.fb.group({
      anchorString: ["", Validators.required],
      fieldLabel: ["", Validators.required],
      fieldType: ["", Validators.required],
      roleType: ["", Validators.required],
      height: ["", Validators.required],
      width: ["", Validators.required],
      removeanchorActive: [false],
      fieldRequired: [false],
    });

    this.FieldSet.get("fieldType")?.setValue(null);
    this.FieldSet.get("roleType")?.setValue(null);
  }
  private mapToBsDateFormat(format: string): string {
    // You can expand this mapping as needed
    switch (format.toLowerCase()) {
      case "mm/dd/yyyy":
        return "MM/DD/YYYY";
      case "dd/mm/yyyy":
        return "DD/MM/YYYY";
      case "yyyy/mm/dd":
        return "YYYY/MM/DD";
      default:
        return "MM/DD/YYYY"; // fallback
    }
  }

  async checkAnchorInDocument(anchor: string): Promise<boolean> {
    // Use cached content if available
    if (this.cachedDocumentContent) {
      const count = await this.countAnchorOccurrences(anchor, this.cachedDocumentContent);
      console.log(`The document has ${count} occurence of anchor string "${anchor}". Do you want to replace.`);
      if (count > 0) {
        alert(`The document has ${count} occurence of anchor string "${anchor}". Do you want to replace.`);
      }
      return count > 0;
    }

    // 🧠 Extract and cache if not already done
    const content = await this.extractDocumentText();

    if (!content) {
      console.warn("No content extracted from document.");
      return false;
    }

    this.cachedDocumentContent = content.toLowerCase();
    const count = await this.countAnchorOccurrences(anchor, this.cachedDocumentContent);
    console.log(`The document has ${count} occurence of anchor string "${anchor}". Do you want to replace.`);
    if (count > 0) {
      alert(`The document has ${count} occurence of anchor string "${anchor}". Do you want to replace.`);
    }
    return count > 0;
  }
  async extractDocumentText(): Promise<string> {
    try {
      this.bbLoader.showLoader();
      let fileExtension: string | undefined;
      let arrayBuffer: ArrayBuffer | undefined;
      let content = "";
      if (this.editmode) {
        if (!this.uploadDocumentID || !this.templates?.cFile_Name) return "";

        const fileResponse: any = await firstValueFrom(
          this.osharepoint.getFileFromDoubee({
            filePath: this.templates.cFile_Name,
            documentID: this.uploadDocumentID,
          })
        );

        arrayBuffer = fileResponse instanceof Blob ? await fileResponse.arrayBuffer() : fileResponse;

        fileExtension = this.templates.cFile_Name.split(".").pop()?.toLowerCase();
      } else {
        // if (!this.files?.length) return "";

        const file = this.files[0];
        if (!file) return "";

        fileExtension = file.name.split(".").pop()?.toLowerCase();
        arrayBuffer = await file.arrayBuffer();
      }

      if (!arrayBuffer || !fileExtension) return "";

      // -------- PDF Extraction --------
      if (fileExtension === "pdf") {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const extracted = text.items
            .map((item: any) => item.str)
            .join(" ")
            .trim();

          content += extracted.length > 10 ? extracted + " " : (await this.runOCRonPDFPage(page)) + " ";
        }
      }

      // -------- Word Extraction --------
      else if (["docx", "doc"].includes(fileExtension)) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;

        const zip = await JSZip.loadAsync(arrayBuffer);
        const headerFiles = Object.keys(zip.files).filter((f) => /^word\/header\d+\.xml$/.test(f));
        let headerText = "";

        for (const fileName of headerFiles) {
          const xml = await zip.file(fileName)?.async("string");
          const matches = xml?.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches?.length) {
            headerText += matches.map((t) => t.replace(/<\/?w:t[^>]*>/g, "")).join(" ") + "\n";
          }
        }

        content = headerText + content;
      } else {
        console.warn("Unsupported file extension:", fileExtension);
        return "";
      }

      return content;
    } catch (error) {
      console.error("❌ Error reading document:", error);
      return "";
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async countAnchorOccurrences(anchor: string, content: string): Promise<number> {
    const pattern = anchor.trim().toLowerCase();
    return content.split(pattern).length - 1;
  }
  async runOCRonPDFPage(page: any): Promise<string> {
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const result = await Tesseract.recognize(dataUrl, "eng");
    return result.data.text;
  }

  ngOnInit(): void {
    this.userId = this.bbStore.getItem("userId") || this.bbStore.getItem("userid");
    this.compID = this.bbStore.getItem("selectedCompanyId");
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey"));
    this.receivedDocumentListData = this.MessagetransferService.getDocumentListData();
    if (this.receivedDocumentListData && typeof this.receivedDocumentListData === "object") {
      const mode = (this.receivedDocumentListData as any)["Mode"];
      if (mode === "e-sign") {
        this.showEditEsign = true;
        this.showManualTabHide = false;
        this.showManualPage = false;
        this.hideTemplateTable = false;
        this.editmode = true;
        this.editfromdetails = true;

        const data = Array.isArray(this.receivedDocumentListData)
          ? this.receivedDocumentListData
          : [this.receivedDocumentListData];
        this.documentdetails = data[0]._id;
        this.EditTemplate(data[0]._id);
      }
    }
    this.MessagetransferService.docList$.subscribe((data) => {
      if (data === "toDocTemplate") {
        this.defaultEsign = true;
      } else {
        this.defaultEsign = false;
      }
    });
    if (this.defaultEsign) {
      //loads esign 1st
      this.esignBtnFn();
    } else {
      this.manualBtnFn();
    }

    //!create template code
    this.dropdownSetting = {
      singleSelection: true,
      idField: "_id",
      textField: "cDisplayName",
      selectAllText: "Select All Products",
      unSelectAllText: "Deselect All Products",
      allowSearchFilter: true,
      searchPlaceholderText: "Search Products",
      itemsShowLimit: 3,
    };
    this.userdropdownSetting = {
      singleSelection: false,
      idField: "_id",
      textField: "company_name",
      selectAllText: "Select All Company",
      unSelectAllText: "Deselect All Company",
      allowSearchFilter: true,
      searchPlaceholderText: "Search Company",
      itemsShowLimit: 3,
    };
    this.onCompanyChange();
    this.loadCategories();
    this.loadDocubeeDetails();
    this.getAllMailTemplates();
    this.loadCompanyList();
    this.loadDefaultAnchorStrings();
    // this.userForm = this.fb.group({
    //   industry: [""],
    //   selectedProduct: [null],
    //   templateName: ["", Validators.required],
    //   // selectedCompany: [null, Validators.required],
    // });

    // this.userForm.controls["industry"].setValue(null);
  }
  ngOnDestroy(): void {
    this.MessagetransferService.manageDocValueFn(null);
    this.defaultEsign = false;
    this.MessagetransferService.clearDocumentListData();
  }

  ngAfterContentInit(): void {
    this.selectedProductType = "Choose Product";
  }
  @Output() esignClicked = new EventEmitter<void>();
  @Output() addNewDocumentClicked: EventEmitter<void> = new EventEmitter<void>();
  @Input() customerData: any;
  @Input() productData: any;
  @Input() updatedProducts: any;

  DocumentTypes: any;
  documentType: any;
  productDropDown: any;
  categoryDropDown: any;
  selectedDocumentType: any = null;
  fromManageDocument!: boolean | false;

  esignBtnFn() {
    this.showManualPage = false;
    this.loadDocubeeDetails();
    this.files = [];
    this.loadDoumentTypes();
    this.esignClicked.emit();
  }

  manualBtnFn() {
    if (!this.showManualTabHide) {
      this.showManualPage = false;
    } else {
      this.showManualPage = true;
    }
    this.getProductDetails();
    this.loadCategories();
    //  this.loadProducts();
    this.esignFilesDetails = [];
    this.loadDoumentTypes();
  }

  set_default_date_single = {
    start: moment().subtract(0, "days").format("YYYY-MM-DD"),
    end: moment().add(30, "days").format("YYYY-MM-DD"),
  };
  async loadProducts(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      // this.products = await this.categoryService.getProductsFilter();
      const allProducts = await this.categoryService.getProductsFilter();
      this.productDropDown = allProducts?.filter((product: any) => product?.bIsPublic === true);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  onCheckedChange(selectedIndex: number) {
    this.AnchorStrings.forEach((anchor, i) => {
      anchor.checked = i === selectedIndex;
    });
  }

  async SaveCustomTemplate() {
    try {
      this.bbLoader.showLoader();

      // const checkedAnchors = this.AnchorStrings?.filter((anchor: any) => anchor.checked === true) || [];

      // const cleanedCheckedAnchors = checkedAnchors.map(({ _id, checked, ...rest }) => rest);

      // const tempData = [...this.tempData, ...cleanedCheckedAnchors];

      const req = {
        fieldDetails: this.tempData,
        inputDocumentId: this.uploadDocumentID,
        fileName: this.files[0]?.name || this.templates.cFile_Name,
        templateid: this.templateid,
        oCompany_Id: this.companyId,
        customtempid: this.customtempid,
        selectedproduct: this.templates?.oProduct_Id?._id,
        industry: this.templates?.oCategoryID?._id,
      };

      const response = await this.docubee.docubeePlaceUpdateFieldsOnDocument(req);

      if (response.status) {
        this.bbToaster.show_success("Template Details updated Successfully");
        this.resetFileUpload();
        this.FieldSet.reset();
        this.loadDocubeeDetails();
        this.tempData = [];
        this.listItems = [];
        this.showEditEsign = false;
      } else {
        this.bbToaster.show_error(response.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  // async loadCategories(): Promise<void> {
  //   try {
  //     this.bbLoader.showLoader();
  //     const industry = await firstValueFrom(this.masterService.getAciveCategories());
  //     this.categoryDropDown = industry.data;
  //   } catch (error) {
  //     console.error("Error fetching categories:", error);
  //   } finally {
  //     this.bbLoader.hideLoader();
  //   }
  // }
  async loadCategories(): Promise<void> {
    try {
      this.bbLoader.showLoader();

      // const industry = await firstValueFrom(this.masterService.getAciveCategories());
      // const allCategories = industry.data || [];

      // Find the category that matches showExecuteContract.classId
      // const mappedClass = allCategories.find((item: any) => item._id === this.showExecuteContract.classId);

      // Store only that category in dropdown
      // this.categoryDropDown = this.showExecuteContract.classId ? this.showExecuteContract.classId : [];
      this.categoryDropDown = this.showExecuteContract.classId.ids.map((id: any, index: string | number) => ({
        _id: id,
        cCategory_Name: this.showExecuteContract.classId.names[index]
      }));

      // Store for later use (used when adding new files)
      this.selectedCategory = this.categoryDropDown?.[0]?._id || null;

    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  backToCustomerAddCustomer() {
    this.manualBtnFn();
    this.files = [];

    // this.customerDetails.showAddCustomer = true;
    // this.customerDetails.ShowManualEsign = false;
  }
  backShowProductsFn() {
    if (this.skipValueProducts) {
      // this.customerDetails.billingCycleDetails = false;
      // this.customerDetails.ShowManualEsign = false;
      // this.customerDetails.showProductsPg = true;
      // console.clear();
      // this.customerDetails.resetCompleteDoc();
      // this.customerDetails.resetStepperLast();
      // this.customerDetails.stepperSecond();
    } else {
      // this.customerDetails.showProductsPg = true;
      // this.customerDetails.resetStepperLast();
      // this.customerDetails.ShowManualEsign = false;
      // this.customerDetails.stepperSecond();
      // this.customerDetails.billingCycleDetails = true;
      // this.customerDetails.resetCompleteDoc();
    }
  }
  backToProductsPgFn() {
    // this.customerDetails.ShowManualEsign = false;
    // this.customerDetails.showProductsPg = true;
    // this.customerDetails.stepperProductsSecondFn();
    // this.customerDetails.stepperProductsLastFn();
  }
  openmodalAddCustomer() {
    let modalAddCustomer = this.element.nativeElement.querySelector(".modal-Manual-wrapper");
    let modalAddCustomerOverlay = this.element.nativeElement.querySelector(".modal-Manual-wrapper-inner");
    this.renderer.setStyle(modalAddCustomer, "display", "block");
    this.renderer.setStyle(modalAddCustomerOverlay, "display", "block");
  }

  async getProductDetails() {
    let proddata;
    if (this.fromManageDocument) {
      proddata = this.productData;
    } else {
      proddata = this.prodDataAccDashboard;
    }
    const response = await this.ocustomerService.getProductDetails(proddata);
    this.savedproducts = response;

    this.categoryDropDown = this.savedproducts.map((item: { category: any }) => item.category);
  }

  async skipAndAddCustomer() {
    try {
      this.bbLoader.showLoader();
      // const response = await firstValueFrom(
      //   this.categoryService.addCustomerDetails(this.customerData)
      // );eProduc
      // const response = this.ocustomerService.addCompany(this.customerData);
      this.openmodalAddCustomer();
    } catch (error) {
      this.bbToaster.show_error("Error saving customer details:", String(error));
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  SaveDocumentfn(queue: boolean) {
    this.fromManageDocument = true;
    const response = { companyId: this.companyId };
    this.queue = queue;
    this.SaveDocument(response);
  }

  async saveBillingAddress(response: any) {
    try {
      this.bbLoader.showLoader();

      const billingdetails = this.customerData;
      if (billingdetails && Object.keys(billingdetails).length > 0) {
        const requestData = {
          billingdetails,
          cCreatedBy: this.BbStoreService.getItem("userId"),
        };
        await this.ocustomerService.addaddresstoCompany(response.companyId, requestData);
      }
    } catch (err) {
      this.bbToaster.show_error("Something went wrong!");
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async saveProducts(response: any) {
    try {
      this.bbLoader.showLoader();
      // const products = this.customerDetails.productData;   old product save without billing
      const products = this.UpdateProductsAccDashboard;
      if (products && products.length > 0) {
        const requestData = {
          products,
          cCreatedBy: this.BbStoreService.getItem("userId"),
          fteData: await firstValueFrom(this.categoryService.fteValues$),
          subscriptionData: await firstValueFrom(this.categoryService.subscriptionValues$),
        };
        const productresponse = await this.ocustomerService.addproductstoCompany(response.companyId, requestData);
        if (productresponse) {
          this.categoryService.clearFteValues();
          this.categoryService.clearSubscriptionValues();
          this.bbToaster.show_success(productresponse.message);
        } else {
          this.bbToaster.show_error(productresponse.message);
          this.categoryService.clearFteValues();
          this.categoryService.clearSubscriptionValues();
        }
      }
    } catch (err) {
      this.bbToaster.show_error("Something went wrong!");
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  // logFormValidationErrors() {
  //   throw new Error("Method not implemented.");
  // }
  redirectToDashboard() {
    // this.customerDetails.GetAllCustomerList();
    // this.customerDetails.ngOnInit();
    // this.customerDetails.isDashboardVisible = true;
    // this.customerDetails.stepperHidden = false;
    // this.customerDetails.showProductsPg = false;
  }

  async onFileSelect(event: any) {
    try {
      this.bbLoader.showLoader();
      this.cachedDocumentContent = "";
      const allowedExtensions = ["docx", "pdf"];
      for (let i = 0; i < event.addedFiles.length; i++) {
        const file = event.addedFiles[i];

        let fileName = file.name.replace(/'/g, "_");
        const modifile = new File([file], fileName.toString(), {
          type: file.type,
        });
        function formatExtensions(extensions: string[]): string {
          if (extensions.length === 0) {
            return "";
          }
          if (extensions.length === 1) {
            return extensions[0] ?? '';
          }
          const lastExtension = extensions.pop();
          return `${extensions.join(", ") ?? ''} and ${lastExtension}`;
        }

        const fileExtension = fileName.split(".").pop().toLowerCase();
        if (allowedExtensions.indexOf(fileExtension) === -1) {
          const formattedExtensions = formatExtensions(allowedExtensions);
          this.bbToaster.show_warn(`Only files with the following extensions are allowed: ${formattedExtensions}`);

          continue;
        }
        if (this.files.find((f: any) => f.name === file.name)) {
          this.bbToaster.show_warn("Selected file already exists.");
          continue;
        }
        if (file.size > 209880487) {
          this.bbToaster.show_warn("file size more than 200MB.");
          continue;
        }

        const data = await this.readFileAsDataURL(file);
        const headerType = this.osharepoint.getMimeType(file.name);
        const docubee = {
          fileName: file.name, // Assuming `fileName` is the name of the file
          data: data,
          headerType: headerType,
        };
        const response = await this.docubee.uploadDocubeeDocument(docubee);
        if (response.status) {
          this.files[0] = modifile;
          if (this.files.length > 0) {
            this.DragDropFn();
            this.uploadDocumentID = response.documentId;
            await this.extractAndStoreDocumentText(file);
            if (this.listItems.length > 0) {
              const updatedListItems: any[] = [];
              const updatedTempData = this.tempData.filter((element: any, _index: number) => {
                const anchorExists = this.cachedDocumentContent.includes(element.anchorString.toLowerCase());
                if (anchorExists) {
                  const listItem = {
                    "Anchor String": element.anchorString,
                    "Field Label": element.name,
                    "Field Type": element.type,
                    "Form role": element.formRoleId,
                    Height: element.height,
                    Width: element.width,
                    "Remove Anchor String": element.removeAnchorString == null ? false : element.removeAnchorString,
                    Required: element.required == null ? false : element.required,
                  };
                  updatedListItems.push(listItem);
                  return true;
                } else {
                  console.warn("Anchor not found in document and will be removed:", element.anchorString);
                  return false;
                }
              });

              this.tempData = updatedTempData;
              this.listItems = updatedListItems;
            }
            this.FieldSet.reset();
            this.cdRef.detectChanges();
            this.bbToaster.show_success(`document upload ID has been successfully generated ${this.uploadDocumentID}`);
          }
        } else {
          this.bbToaster.show_error(`${response.message}`);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async extractAndStoreDocumentText(file: File): Promise<void> {
    try {
      let content = "";
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();

      if (fileExtension === "pdf") {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const extracted = text.items.map((item: any) => item.str).join(" ");
          content += extracted + " ";
        }
      } else if (fileExtension === "docx") {
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;

        // Add header extraction if needed using JSZip (as you already have)
      }

      this.extractedContent = content.toLowerCase();
      this.cachedDocumentContent = this.extractedContent;
    } catch (err) {
      console.error("❌ Error extracting document text:", err);
      this.extractedContent = "";
    }
  }
  // onFileManualSelect(event: any) {
  //   const allowedExtensions = ["docx", "pdf"];
  //   const invalidFiles: string[] = [];

  //   for (let i = 0; i < event.addedFiles.length; i++) {
  //     const file = event.addedFiles[i];
  //     const fileName = file.name.replace(/'/g, "_");
  //     const fileExtension = fileName.split(".").pop().toLowerCase();

  //     const modifile = new File([file], fileName.toString(), { type: file.type });

  //     if (!allowedExtensions.includes(fileExtension)) {
  //       invalidFiles.push(file.name);
  //       continue;
  //     }

  //     if (this.files.find((f: any) => f.data.name === file.name)) {
  //       this.bbToaster.show_warn("Selected file already exists.");
  //       continue;
  //     }

  //     if (file.size > 209880487) {
  //       this.bbToaster.show_warn("File size is more than 200MB.");
  //       continue;
  //     }

  //     this.files.push({
  //       data: modifile,
  //       productID: null,
  //       categoryID: null,
  //       productName: "",
  //       docuemntTypeID: null,
  //       fromDate: this.set_default_date_single?.start,
  //       dueDate: this.set_default_date_single?.end,
  //       dateRange: this.set_default_date_single,
  //     });

  //   }

  //   if (invalidFiles.length > 0) {
  //     const formattedExtensions = this.formatExtensions(allowedExtensions);
  //     this.bbToaster.show_warn(`Only files with the following extensions are allowed: ${formattedExtensions}`);
  //   }
  // }
  onFileManualSelect(event: any) {
    const allowedExtensions = ["docx", "pdf"];

    for (const file of event.files) {
      const fileName = file.name.replace(/'/g, "_");
      const extension = fileName.split(".").pop()?.toLowerCase();

      if (!extension || !allowedExtensions.includes(extension)) {
        this.bbToaster.show_warn(`Only ${allowedExtensions.join(", ")} files are allowed`);
        continue;
      }

      // ✅ TRUE duplicate check
      if (this.files.some((f) => f.data.name === fileName)) {
        this.bbToaster.show_warn(`File "${fileName}" already exists.`);
        continue;
      }

      if (file.size > 209715200) {
        this.bbToaster.show_warn("File size is more than 200MB.");
        continue;
      }

      const modifiedFile = new File([file], fileName, { type: file.type });

      this.files.push({
        data: modifiedFile,
        productID: null,
        categoryID: this.selectedCategory?._id || null,
        selectedCategory: this.selectedCategory?._id || null,
        productName: "",
        docuemntTypeID: null,
        fromDate: null,
        dueDate: null,
        dateRange: null,
        effectiveDate: null,
        endDate: null,
      });
    }

    // ✅ CRITICAL: clear PrimeNG internal memory
    if (event.originalEvent?.target) {
      event.originalEvent.target.value = "";
    }
  }

  formatExtensions(extensions: string[]): string {
    if (extensions.length === 0) {
      return "";
    }
    if (extensions.length === 1) {
      return extensions[0] ?? '';
    }
    const lastExtension = extensions.pop() ?? '';
    return `${extensions.join(", ")} and ${lastExtension}`;
  }

  async SaveDocument(response: any) {
    try {
      this.bbLoader.showLoader();
      if (this.fromManageDocument == true) {
        if (!this.checkDocumentTypeValidation()) {
          return;
        }
      }
      if (this.showManualPage) {
        if (this.files && this.files.length > 0) {
          const result = await firstValueFrom(this.sharePoint.getSharePointToken());
          const sharePointToken = result.access_token;
          const filepaths: string[] = [];
          const now = new Date();
          const milliseconds = now.getMilliseconds();
          const updatedFiles = this.files.map((file) => {
            const fileExtension = file.data.name.split(".").pop();
            const baseName = file.data.name.replace(`.${fileExtension}`, "");
            const newFileName = `${baseName}_${milliseconds}.${fileExtension}`;

            return {
              ...file,
              data: new File([file.data], newFileName, {
                type: file.data.type,
                lastModified: file.data.lastModified,
              }),
            };
          });

          var ProductPath = `${this.customerData.companyName}`;
          for (const file of updatedFiles) {
            // if (folderres) {
            var uploadpath = ProductPath;
            if (file.productName && file.productName && file.productName != "") {
              uploadpath = ProductPath + "/" + file.productName;
            }
            const SubFoler = await this.sharePoint.ensureFolderExists(uploadpath, sharePointToken);
            if (SubFoler) {
              const filepath = await this.sharePoint.uploadFile(`${uploadpath}`, sharePointToken, file.data);

              if (filepath.status === 200) {
                filepaths.push(uploadpath);
              } else {
                this.filestatus = false;
                this.bbToaster.show_error(`File upload failed for ${file.data.name}`);
                break;
              }
            }
            // }
          }
          if (this.filestatus) {
            const tableRows = updatedFiles.map((file, index) => ({
              ...file,
              fromDate: file?.fromDate ? file?.fromDate : new Date(this.set_default_date_single?.start),
              dueDate: file?.dueDate ? file?.dueDate : new Date(this.set_default_date_single?.end),
              IDs: response,
              userId: this.BbStoreService.getItem("userId"),
              fileName: file.data.name,
              filepath: filepaths[index],
            }));
            const documentResponse = await firstValueFrom(this.categoryService.saveDocumentDetails(tableRows));
            if (documentResponse) {
              this.bbToaster.show_success(documentResponse.message);
              if (this.fromManageDocument == true) {
                this.onDocumentSavedClicked();
              }
            } else {
              this.bbToaster.show_error(documentResponse.message);
            }
          }
        }
      } else {
        const tableEsignRows = this.esignFilesDetails.map((file) => ({
          ...file,
          IDs: response,
          userId: this.BbStoreService.getItem("userId"),
          fromDate: file?.fromDate ? file?.fromDate : new Date(this.set_default_date_single?.start),
          dueDate: file?.dueDate ? file?.dueDate : new Date(this.set_default_date_single?.end),
        }));
        let documentResponse;
        if (this.queue) {
          //  this.bbToaster.show_warn("Validity period won't be applied when queuing this document.");
          documentResponse = await firstValueFrom(this.categoryService.saveEsignDocumentDetailstoQueue(tableEsignRows));
        } else {
          documentResponse = await firstValueFrom(this.categoryService.saveEsignDocumentDetails(tableEsignRows));
        }

        if (documentResponse.success) {
          this.bbToaster.show_success(documentResponse.message);
          if (this.fromManageDocument == true) {
            this.onDocumentSavedClicked();
          }
        } else {
          this.bbToaster.show_error(documentResponse.message);
        }

        //Esign Code.
      }
    } catch (err) {
      console.log("Esign Catch: ", err);
      this.bbToaster.show_error("Something went wrong!");
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  onDocumentSavedClicked() {
    this.addNewDocumentClicked.emit();
  }
  checkDocumentTypeValidation(): boolean {
    if (this.showManualPage) {
      if (this.files.some((file) => file.docuemntTypeID === "" || file.docuemntTypeID === null)) {
        this.bbToaster.show_error("Please select the Document type.");
        return false;
      }
    } else {
      // if (this.esignFilesDetails.some((file) => file.DocTypeId === "" || file.DocTypeId === null)) {
      //   this.bbToaster.show_error("Please select the Document type.");
      //   return false;
      // }
    }
    return true;
  }
  async SaveDetails(queue: boolean) {
    try {
      this.fromManageDocument = false;
      this.bbLoader.showLoader();
      if (!this.checkDocumentTypeValidation()) {
        return;
      }
      const response = await this.ocustomerService.addCompany(this.customerData);
      this.queue = queue;
      if (response.success) {
        this.saveBillingAddress(response);
        this.saveProducts(response);
        this.SaveDocument(response);
        this.categoryService.clearProductList();
        this.openmodalAddCustomer();
      } else {
        this.bbToaster.show_error(response.message);
        this.categoryService.clearProductList();
      }
    } catch (err) {
      this.bbToaster.show_error("Something went wrong!");
      this.categoryService.clearProductList();
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  RemoveManualDocumentFromList(index: any) {
    this.files.splice(index, 1);
  }

  getSingleDateStartDate(date: any, index: any) {
    this.files[index].fromDate = date.startDate;
  }

  getSingleDateDuetDate(date: any, index: any) {
    if (this.files[index].fromDate && this.files[index].fromDate > date.startDate) {
      this.bbToaster.show_warn("Please select valid date");
      const datePickerElement = document.getElementById(`due_date${index}`) as any;
      if (datePickerElement) {
        datePickerElement.default_date = this.set_default_date_single;
      }
      return;
    } else {
      this.files[index].dueDate = date.startDate;
    }
  }

  getDate(date: any, index: any) {
    this.files[index].fromDate = date.startDate;
    this.files[index].dueDate = date.endDate;
  }

  async loadDoumentTypes() {
    const docTypeData: DocumentTypeName = await firstValueFrom(this.masterService.allActiveDocumentTypes());
    this.DocumentTypes = docTypeData.data.sort((a: { cDocument_Type: string }, b: { cDocument_Type: any }) =>
      a?.cDocument_Type?.localeCompare(b?.cDocument_Type)
    );
  }
  drpProductChoose(_event: any, _index: any) {
    // this.files[index].productID = event._id;
    // this.files[index].productName = event.cDisplayName;
  }

  // drpCategoryChoose(event: any, index: any) {
  //   this.files[index].categoryID = event._id;
  //   this.files[index].categoryName = event.cCategory_Name;
  //   const selectedCategory = this.savedproducts.find(
  //     (item: { category: { _id: any } }) => item.category._id === event._id
  //   );

  //   if (selectedCategory) {
  //     this.files[index].categoryID = selectedCategory.category._id;
  //     this.files[index].categoryName = selectedCategory.category.cCategory_Name;
  //     this.productDropDown = Array.isArray(selectedCategory.products)
  //       ? selectedCategory.products
  //       : [selectedCategory.products];
  //     //  this.files[index].product=null
  //     if (this.CategoeryAgainstProductSelect) {
  //       this.CategoeryAgainstProductSelect.writeValue(null);
  //     }
  //     this.cdRef.detectChanges();
  //   }
  // }
  drpCategoryChoose(event: any, index: number) {
    const selected = this.categoryDropDown.find((x: { _id: any; }) => x._id === event);
    this.selectedCategory = selected?._id;
    console.log('this.selectedCategory: ', this.selectedCategory);
    this.files[index].selectedCategory = selected?._id;            // ID
    this.files[index].selectedCategoryName = selected?.cCategory_Name || null;
  }

  drpDocumentType(event: any, index: any) {
    this.files[index].docuemntTypeID = event;
  }
  drpDocumentTypeEsign(event: any, index: any) {
    // this.esignFilesDetails[index].DocTypeId= event._id;

    this.esignFilesDetails.forEach((f: any) => {
      if (f.TemplateId === index._id) {
        f.DocTypeId = event._id;
        return;
      }
    });
  }
  getDateEsign(date: any, rowData: any) {
    this.esignFilesDetails.forEach((f: any) => {
      if (f.TemplateId === rowData._id) {
        f.fromDate = date.startDate;
        f.dueDate = date.endDate;
        return;
      }
    });
  }

  getSingleDateStartDateEsign(date: any, rowData: any) {
    this.esignFilesDetails.forEach((f: any) => {
      if (f.TemplateId === rowData._id) {
        f.fromDate = date.startDate;
        return;
      }
    });
  }
  getSingleDateDuetDateEsign(date: any, rowData: any) {
    this.esignFilesDetails.forEach((f: any) => {
      if (f.TemplateId === rowData._id) {
        f.dueDate = date.startDate;
        return;
      }
    });
  }
  async loadDocubeeDetails(): Promise<void> {
    try {
      let proddataid;
      if (this.fromManageDocument) {
        const productIds = this.savedproducts.flatMap((category: { products: any[] }) =>
          category.products.map((product) => product._id)
        );
        proddataid = productIds;
      } else {
        proddataid = this.prodDataAccDashboard;
      }
      if (!Array.isArray(proddataid)) {
        console.error("proddataid is not an array, converting to an array.");
        proddataid = [proddataid];
      }
      this.docubeeList = await this.docubee.getDocubeeTempList(proddataid, this.companyId);
    } catch (error) {
      console.error("Error fetching Templates:", error);
    }
  }
  toggleFieldsVisibility(rowData: any, index: any): void {
    if (this.esignFilesDetails && this.esignFilesDetails.find((f: any) => f.TemplateId === rowData._id)) {
      const esignData = this.esignFilesDetails.filter((f: any) => f.TemplateId != rowData._id);
      this.docubeeList[index].showFields = false;
      if (esignData.length > 0) {
        this.esignFilesDetails = esignData;
      } else {
        this.esignFilesDetails = [];
      }
      return;
    }
    this.esignFilesDetails.push({
      CheckBox: true,
      TemplateId: rowData._id,
      ProductId: rowData.oProduct_Id ? rowData.oProduct_Id : "N/A",
      IndustryId: rowData.categoryID,
      cDocubeeFieldSetId: rowData.cDocubeeFieldSetId,
      cFile_Name: rowData.cFile_Name,
      DocTypeId: null,
    });
    this.docubeeList[index].showFields = true;
  }

  sendEsignRequest() {
    if (this.esignFilesDetails.some((file) => file.docuemntTypeID === "" || file.docuemntTypeID === null)) {
      this.bbToaster.show_error("Some fields are missing.");
      return;
    }
  }

  closeViewModal(event: boolean) {
    this.showViewDocModal = event;
  }
  async loadDefaultAnchorStrings(): Promise<void> {
    try {
      this.defaultanchorstrings = await this.docubee.beActiveAnchorStringList();
      // const filteredAnchor = this.defaultanchorstrings.map((item: { [x: string]: any }) => {
      //   return {
      //     "anchorString": item["anchorString"],
      //     "name": item["name"],
      //     "formRoleId": item["formRoleId"],

      //     _id: item["_id"],
      //   };
      // });
      // this.DefaultAnchorStrings = filteredAnchor;
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }
  async EditTemplate(template: any) {
    this.showEditEsign = true;
    this.DragDropFn();
    this.editmode = true;
    this.bbLoader.showLoader();

    try {
      let res;
      if (this.editfromdetails) {
        res = await firstValueFrom(this.docubee.getTemplateDetails(template.oTemplate_Id));
      } else {
        res = await firstValueFrom(this.docubee.getTemplateDetails(template._id));
      }

      this.loadDefaultAnchorStrings();
      this.templates = res.data;
      this.customtempid = this.templates._id;
      this.uploadDocumentID = this.templates.cDocubeeUploadId;
      this.docuemntTypeID = this.templates?.oDocumentTypeID._id;
      this.selectedDocumentTypeId = this.docuemntTypeID;
      this.listItems = [];
      this.tempData = this.templates?.AnchorStrings || [];

      // const anchorStrings = this.tempData.map((item) => item.anchorString);
      this.reassignData();
      this.cdRef.detectChanges();
    } catch (err) {
      console.error(err);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async viewDocument(fileName: string, docubeeId: string, template: string) {
    this.bbLoader.showLoader();
    try {
      const data = {
        filePath: fileName,
        documentID: docubeeId,
      };

      // Get file Blob from backend
      const fileBlob: Blob = await firstValueFrom(this.docubee.getFileFromDocubee(data));

      this.PreviewDocument = {
        fileBlob,
        fileName,
        templateName: template,
      };

      // To preview PDF inline:
      if (fileName.toLowerCase().endsWith(".pdf")) {
        const fileURL = URL.createObjectURL(fileBlob);
        window.open(fileURL);
        this.showViewDocModal = true;
        // Optionally revoke URL after some time if needed
      } else {
        // For Word docs (.doc, .docx), browsers can't preview natively,
        // so force download instead
        const url = URL.createObjectURL(fileBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Error loading document:", err);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  // !create template code
  ngAfterViewInit() {
    this.dropzoneHtml = this.element.nativeElement.querySelector(".draganddrop-outer");
  }
  DragDropFn() {
    if (this.dropzoneHtml) {
      this.renderer.removeClass(this.dropzoneHtml, "activeDragandDrop");
    }
    this.hideFieldSet = false;
  }

  action_fields = {
    delete: true,
    edit: false,
    view: true,
    copy: false,
    manager_type: false,
    email: false,
    restrict_view: false,
    editprofile: false,
    viewdocument: false,
    adddocument: false,
    userprofile: false,
  };
  action_field = {
    delete: true,
    edit: true,
    view: false,
    copy: false,
    manager_type: false,
    email: false,
    restrict_view: false,
    editprofile: false,
    viewdocument: false,
    adddocument: false,
    userprofile: false,
  };
  image_colum = {
    show: false,
    header: "Global",
    url: "../../assets/icons/download.png",
  };
  position = "last";
  button_colum = {
    header: "Status",
    backgroud_colour: "red",
  };

  recive_dataField(data: any) {
    if (data.type == "delete") {
      const deletedAnchorString = data.data["Anchor String"];

      this.tempData = this.tempData.filter((item) => item.anchorString !== data.data["Anchor String"]);
      this.listItems = this.listItems.filter((item) => item["Anchor String"] !== data.data["Anchor String"]);
      const anchorToUncheck = this.defaultanchorstrings.find(
        (a: { anchorString: any }) => a.anchorString === deletedAnchorString
      );
      if (anchorToUncheck) {
        anchorToUncheck.checked = false;
      }
      this.bbToaster.show_success("Deleted Successfully.");
    } else if (data.type == "edit") {
      this.EditAnchorStrings(data.data);
    }
  }
  recive_data(data: any) {
    if (data.type == "delete") {
      this.delete(data.data);
    } else if (data.type == "view") {
      this.getDoumentView(data.data);
    }
  }

  async onFileSelectedChange(event: any) {
    if (event && event._id !== "0") {
      try {
        const matchedtemplate = this.tempData.find((cat) => String(cat._id).trim() == String(event._id).trim());

        const uploadId = matchedtemplate.cDocubeeUploadId;
        await this.docubee.GetDocubeeFileDetails(uploadId);
      } catch (error) {
        console.error("Error fetching products by category:", error);
      }
    } else {
      this.products = [];
    }
  }

  async onIndustryChange(event: any) {
    if (event && event._id !== "0") {
      try {
        this.tempdocuments = await this.categoryService.getDocumentsbyCategory(event._id);
        this.products = await this.categoryService.getProductsByCategory(event._id);
      } catch (error) {
        console.error("Error fetching products by category:", error);
      }
    } else {
      this.products = [];
    }
  }

  async loadCompanyList(): Promise<void> {
    try {
      this.companyList = await firstValueFrom(this.masterService.getUserCompanyList());
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }
  async onCompanyChange() {
    const IndustryData = await firstValueFrom(this.masterService.getAllCategories());
    this.categories = IndustryData.data;
  }

  async onCompanyChangeAll() {
    const IndustryData = await firstValueFrom(this.masterService.getAllCategories());
    this.categories = IndustryData.data;
    // this.categories = await this.categoryService.getCategoriesbyUserCompany(this.compID);
  }

  deleteModal: boolean = false;
  showTempDocument() {
    this.deleteModal = true;
  }
  closeTempDocument() {
    this.deleteModal = false;
  }

  resetFileUpload() {
    this.hideFieldSet = true;
    this.files = [];
    // this.userForm.reset();
    this.loadDefaultAnchorStrings();
    this.FieldSet.reset();
    if (this.dropzoneHtml) {
      this.renderer.addClass(this.dropzoneHtml, "activeDragandDrop");
    }
    this.listItems = [];
    this.tempData = [];
    this.uploadDocumentID = "";
    this.closeTempDocument();
    this.showEditEsign = false;
    if (this.editfromdetails) {
      this.onDocumentSavedClicked();
    }
    this.cdRef.detectChanges();
  }
  logFormValidationErrors(iControls: any) {
    Object.keys(iControls.controls).forEach((key) => {
      const controlErrors = iControls.get(key)?.errors;
      if (controlErrors) {
        iControls.controls[key].markAsTouched();
      }
    });
  }
  // async SaveTemplate() {
  //   try {

  //     this.bbLoader.showLoader();
  //     if (this.userForm.valid) {
  //       // const selectedCompany = this.userForm.controls["selectedCompany"].value;
  //       // const selectedCompanyId = selectedCompany ? selectedCompany.map((company: any) => company._id) : [];
  //       const req = {
  //         fieldDetails: this.tempData,
  //         inputDocumentId: this.uploadDocumentID,
  //         productID: this.userForm.controls["selectedProduct"]?.value?.[0]._id,
  //         templateName: this.userForm.controls["templateName"]?.value,
  //         fileName: this.files[0].name,
  //       };
  //       const response = await this.docubee.updateFieldsDetails(req);

  //       if (response.status) {
  //         this.bbToaster.show_success("Template Details Created Successfully");
  //         this.resetFileUpload();
  //         this.FieldSet.reset();
  //         this.loadDocubeeDetails();
  //         this.tempData = [];
  //         this.listItems = [];
  //       } else {
  //         this.bbToaster.show_error(response.message);
  //       }
  //     } else {
  //       // this.logFormValidationErrors(this.userForm);
  //       this.bbToaster.show_error("Please enter the required fields");
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   } finally {
  //     this.bbLoader.hideLoader();
  //   }
  // }

  async updateTemplate(save: "save" | "update" | "savecompany") {
    try {
      this.bbLoader.showLoader();
      const templateName = !this.editfromdetails
        ? this.templateName.nativeElement.value
        : this.templates.cTemplate_Name;

      if (!templateName) {
        this.bbToaster.show_error("Template Name is required.");
        return;
      }
      const selectedValue = !this.editfromdetails
        ? this.DocumentType.selectedValues[0]
        : this.templates?.oDocumentTypeID?.cDocument_Type;

      if (!selectedValue) {
        this.bbToaster.show_error("Document Type is required.");
        return;
      }
      if (save === "save" || save === "savecompany") {
        const response = await firstValueFrom(this.masterService.checkTemplateName(templateName));
        if (response.exists) {
          this.bbToaster.show_error("Template name already exists.");
          return;
        }
      } else {
        const isDuplicate = this.docubeeList.some(
          (item: { [x: string]: any }) =>
            item["Template Name"]?.trim()?.toLowerCase() === templateName.trim()?.toLowerCase() &&
            item["_id"] !== this.customtempid
        );
        if (isDuplicate) {
          this.bbToaster.show_error("Another template with this name already exists.");
          return;
        }
      }
      const checkedAnchors = this.defaultanchorstrings?.filter((anchor: any) => anchor.checked === true) || [];
      let cleanedCheckedAnchors = checkedAnchors.map((fullAnchor: any) => ({
        anchorString: fullAnchor.anchorString,
        name: fullAnchor.name,
        formRoleId: fullAnchor.formRoleId,
        type: fullAnchor.type || "text",
        required: fullAnchor.required ?? false,
        removeAnchorString: fullAnchor.removeAnchorString ?? false,
        height: fullAnchor.height || 24,
        width: fullAnchor.width || 210,
      }));

      cleanedCheckedAnchors = cleanedCheckedAnchors.map((item: any) => {
        const { _id, ...rest } = item;
        return rest;
      });

      const tempData = [...this.tempData, ...cleanedCheckedAnchors];

      if (tempData.length == 0) {
        this.bbToaster.show_error("No Data added");
        return;
      }

      const req = {
        fieldDetails: tempData,
        inputDocumentId: this.uploadDocumentID,
        fileName: this.files[0]?.name || this.templates.cFile_Name,
        docuemntTypeID: this.selectedDocumentTypeId,
        // templateid:this.templateid,
        customtempid: save == "update" ? this.customtempid : undefined,
        oCompany_Id: save == "savecompany" ? this.companyId : undefined,
        selectedproduct: this.templates?.oProduct_Id?._id,
        industry: this.templates?.oCategoryID?._id,

        cTemplate_Name: templateName || "",
      };

      const response = await this.docubee.docubeePlaceUpdateFieldsOnDocument(req);

      if (response.status) {
        if (save == "update") {
          this.bbToaster.show_success("Template Details updated Successfully");
        } else {
          this.bbToaster.show_success("Template Details saved Successfully");
        }
        if (this.editfromdetails) {
          const data = {
            cFile_Name: this.files[0]?.name || this.templates.cFile_Name,
            oTemplate_Id: response.documentId._id,
          };
          const fileResponse = await firstValueFrom(
            this.ocustomerService.UpdateDocumentDetails(this.documentdetails._id, data)
          );
          if (fileResponse) {
            this.onDocumentSavedClicked();
          }
        }

        this.resetFileUpload();
        this.FieldSet.reset();
        this.loadDocubeeDetails();
        this.loadDefaultAnchorStrings();
        this.tempData = [];
        this.listItems = [];
        this.showEditEsign = false;
        this.cdRef.detectChanges();
      } else {
        this.bbToaster.show_error(response.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async readFileAsDataURL(file: any) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
  async addDataToList() {
    if (this.FieldSet.valid) {
      const anchor = this.FieldSet.get("anchorString")?.value.trim();

      if (!anchor) {
        this.bbToaster.show_error("Anchor string cannot be empty.");
        return;
      }
      //ABGCRM-564 fixed
      const Field = {
        anchorString: this.FieldSet.get("anchorString")?.value.trim(),
        name: this.FieldSet.get("fieldLabel")?.value.trim(),
        type: this.FieldSet.get("fieldType")?.value.trim(),
        formRoleId: this.FieldSet.get("roleType")?.value.trim(),
        height: this.FieldSet.get("height")?.value,
        width: this.FieldSet.get("width")?.value,
        removeAnchorString: this.FieldSet.get("removeanchorActive")?.value,
        required: this.FieldSet.get("fieldRequired")?.value,
      };

      // const isDuplicate = this.tempData.some((item, i) => item.anchorString === Field.anchorString && (!this.isEditMode || i !== this.editIndex));

      const isDuplicate = this.tempData.some(
        (item, index) => item.anchorString === Field.anchorString && (!this.isEditMode || index !== this.editIndex)
      );

      if (isDuplicate) {
        this.bbToaster.show_error("Duplicate anchor string.");
        return;
      }
      const anchorExists = await this.checkAnchorInDocument(anchor);
      if (!anchorExists) {
        this.bbToaster.show_error(
          `The document does not contan an anchor string "${anchor}".`
        );
        return;
      }
      this.listItems = [];

      // In edit mode, replace the item
      if (this.isEditMode && this.editIndex !== null) {
        this.tempData.splice(this.editIndex, 1); // remove old entry
        this.bbToaster.show_success("Field updated successfully.");
      } else {
        this.bbToaster.show_success("Field added successfully.");
      }

      this.tempData.push(Field);

      this.FieldSet.reset();
      this.isEditMode = false;
      this.editIndex = null;
      this.reassignData();
      this.cdRef.detectChanges();
    } else {
      this.logFormValidationErrors(this.FieldSet);
      this.bbToaster.show_error("Please enter the required fields");
    }
  }

  async EditAnchorStrings(fieldData: any): Promise<void> {
    this.isEditMode = true;
    this.editIndex = this.listItems.findIndex((item) => item.anchorString === fieldData.anchorString);
    this.FieldSet.patchValue({
      anchorString: fieldData["Anchor String"] || "",
      fieldLabel: fieldData["Field Label"] || "",
      fieldType: fieldData["Field Type"] || "",
      roleType: fieldData["Form role"] || "",
      height: fieldData["Height"] || 24,
      width: fieldData["Width"] || 210,
      removeanchorActive: !!fieldData["Remove Anchor String"],
      fieldRequired: !!fieldData["Required"],
    });

    const anchorInput = document.getElementById("anchorString");
    if (anchorInput) {
      anchorInput.scrollIntoView({ behavior: "smooth", block: "center" });
      anchorInput.focus();
    }
  }

  ClearDataToList() {
    this.FieldSet.reset();
    this.isEditMode = false;
    this.editIndex = null;
    this.cachedDocumentContent = "";
    if (!this.editfromdetails) {
      this.editmode = false;
    }
  }

  delete(data: any) {
    const _id = data["_id"];
    firstValueFrom(this.masterService.beActiveZeroDocubeeList(_id))
      .then((_response) => {
        this.bbToaster.show_success("Docubee template deactivated successfully.");
        this.listItems = this.listItems.filter((item: any) => item._id !== _id);
        this.reassignData();
        this.loadDocubeeDetails();
        this.getAllMailTemplates();
      })
      .catch((error) => {
        console.error("Error deactivating docubee template:", error);
        this.bbToaster.show_error("Failed to deactivate docubee template.");
      });
    this.listItems = [];
    this.tempData = this.tempData.filter((item) => item.anchorString !== data["Anchor String"]);
    this.reassignData();
  }

  reassignData() {
    this.listItems = [];
    this.tempData.forEach((element: any) => {
      this.listItems.push({
        "Anchor String": element.anchorString,
        "Field Label": element.name,
        "Field Type": element.type,
        "Form role": element.formRoleId,
        Height: element.height,
        Width: element.width,
        "Remove Anchor String": element.removeAnchorString == null ? false : element.removeAnchorString,
        Required: element.required == null ? false : element.required,
      });
    });
    this.cdRef.detectChanges();
  }
  drpFieldTypeChange(event: any) {
    switch (event) {
      case "checkbox": {
        this.height = 15;
        this.width = 15;
        break;
      }
      case "radiogroup": {
        this.height = 15;
        this.width = 15;
        break;
      }
      case "date": {
        this.height = 24;
        this.width = 210;
        break;
      }
      case "initials": {
        this.height = 24;
        this.width = 24;
        break;
      }
      case "signature": {
        this.height = 24;
        this.width = 210;
        break;
      }
      case "text": {
        this.height = 24;
        this.width = 210;
        break;
      }
      default: {
        this.height = 24;
        this.width = 210;
      }
    }
    this.FieldSet.get("height")?.setValue(this.height);
    this.FieldSet.get("width")?.setValue(this.width);
  }

  // onAnchorCheckedChange(event: any, anchor: any): void {
  //   const alreadyExists = this.listItems.some(
  //     item => item["Anchor String"] === anchor.anchorString
  //   );

  //   if (alreadyExists) {
  //     console.warn("Duplicate anchor string detected:", anchor.anchorString);
  //     this.bbToaster.show_warn("This anchor string is already added.");

  //     // Prevent the checkbox from being set to true
  //     anchor.checked = true;
  //     event.target.checked = true;

  //     this.cdRef.detectChanges();
  //     return;
  //   }

  //   anchor.checked = event.target.checked;

  //   if (anchor.checked) {
  //     const existsInTemp = this.tempData.some(item => item.anchorString === anchor.anchorString);
  //     if (!existsInTemp) {
  //       this.tempData.push(anchor);
  //     }
  //   } else {
  //     this.tempData = this.tempData.filter(item => item.anchorString !== anchor.anchorString);
  //   }
  //   this.reassignData();
  //   // Update visibility and UI
  //   this.hideFieldSet = this.tempData.length === 0;
  //   this.cdRef.detectChanges();
  // }

  // onAnchorCheckedChange(event: any, anchor: any): void {
  //   const isChecked = event.target.checked;
  //   const alreadyExists = this.listItems.some(
  //     item => item["Anchor String"] === anchor.anchorString
  //   );

  //   // If it's already in list and user is trying to uncheck, allow it
  //   if (alreadyExists && !isChecked) {
  //     anchor.checked = false;
  //     this.tempData = this.tempData.filter(item => item.anchorString !== anchor.anchorString);
  //     this.reassignData();
  //     this.hideFieldSet = this.tempData.length === 0;
  //     this.cdRef.detectChanges();
  //     return;
  //   }

  //   // If it's already in list and trying to re-add it — warn and block
  //   if (alreadyExists && isChecked) {
  //     console.warn("❗ Duplicate anchor string detected:", anchor.anchorString);
  //     this.bbToaster.show_warn("This anchor string is already added.");
  //     anchor.checked = true;
  //     event.target.checked = true;
  //     this.cdRef.detectChanges();
  //     return;
  //   }

  //   // Handle new check
  //   anchor.checked = isChecked;

  //   if (isChecked) {
  //     const existsInTemp = this.tempData.some(item => item.anchorString === anchor.anchorString);
  //     if (!existsInTemp) {
  //       this.tempData.push(anchor);
  //     }
  //   } else {
  //     this.tempData = this.tempData.filter(item => item.anchorString !== anchor.anchorString);
  //   }

  //   this.reassignData();
  //   this.hideFieldSet = this.tempData.length === 0;
  //   this.cdRef.detectChanges();
  // }
  async onAnchorCheckedChange(event: any, anchor: any): Promise<void> {
    const isChecked = event.target.checked;

    const alreadyExists = this.listItems.some((item) => item["Anchor String"] === anchor.anchorString);

    // ✅ If anchor exists in listItems and user tries to uncheck
    if (alreadyExists && !isChecked) {
      anchor.checked = false;
      this.tempData = this.tempData.filter((item) => item.anchorString !== anchor.anchorString);
      this.reassignData();
      // this.hideFieldSet = this.tempData.length === 0;
      // this.cdRef.detectChanges();
      this.hideFieldSet = false; //ABGCRM-562 fix
      return;
    }

    // ❌ If anchor exists and user tries to re-check — block it
    if (alreadyExists && isChecked) {
      console.warn("❗ Duplicate anchor string detected:", anchor.anchorString);
      this.bbToaster.show_warn("This anchor string is already added.");
      anchor.checked = true;
      event.target.checked = true;
      this.cdRef.detectChanges();
      return;
    }

    // Handle new check/uncheck
    // anchor.checked = isChecked;

    if (isChecked) {
      const isValid = await this.checkAnchorInDocument(anchor.anchorString);
      if (!isValid) {
        this.bbToaster.show_warn(`The document does not contan an anchor string "${anchor.anchorString}"`);
        anchor.checked = false;
        event.target.checked = false;
        this.cdRef.detectChanges();
        return;
      }

      const existsInTemp = this.tempData.some((item) => item.anchorString === anchor.anchorString);
      if (!existsInTemp) {
        this.tempData.push(anchor);
      }
    } else {
      this.tempData = this.tempData.filter((item) => item.anchorString !== anchor.anchorString);
    }

    this.reassignData();
    this.hideFieldSet = false; //ABGCRM-562 fix
    this.cdRef.detectChanges();
  }

  async templateNameCheck(event: Event): Promise<void> {
    try {
      this.bbLoader.showLoader();
      const templateName = (event.target as HTMLInputElement).value;
      if (templateName) {
        const response = await firstValueFrom(this.masterService.checkTemplateName(templateName));
        if (response.exists) {
          // this.userForm.controls["templateName"].setErrors({ exists: true });
          // this.userForm.controls["templateName"].setValue("");
          this.bbToaster.show_error("Template name already exists.");
          return;
        } else {
          // this.userForm.controls["templateName"].setErrors(null);
        }
      }
    } catch (error) {
      console.error("Error checking template name:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async getAllMailTemplates() {
    try {
      const rolesDataVal: RolesData = await firstValueFrom(this.masterService.getAllRoles());
      this.rolesData = rolesDataVal.data;
    } catch (error) {
      console.error("Error fetching mail templates:", error);
    }
  }

  getDoumentView(rowdata: any) {
    this.doubeedownloadFile(rowdata["File Name"], rowdata["Docubee Upload Id"], rowdata["Template Name"]);
  }

  async doubeedownloadFile(FileName: any, DocumentID: any, templateName: any) {
    try {
      this.bbLoader.showLoader();
      const fileUrl = {
        filePath: `${FileName}`,
        documentID: `${DocumentID}`,
      };
      const fileResponse = await firstValueFrom(this.osharepoint.getFileFromDoubee(fileUrl));
      if (FileName.split(".")[0] == "pdf") {
        this.PreviewDocument = {
          fileBlob: fileResponse,
          fileName: FileName,
          templateName: templateName,
        };
        this.showViewDocModal = true;
      } else {
        const mimeType = this.osharepoint.getMimeType(FileName);
        const blob = new Blob([fileResponse], { type: mimeType });

        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = FileName;
        document.body.appendChild(link);
        link.click();

        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(link);
        this.bbToaster.show_success(`${templateName} document downloaded`);
      }
    } catch (err) {
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async fildsMdl() {
    setTimeout(() => {
      this.isModal = true;
      this.cdRef.detectChanges();
    }, 0);

    if (!this.defaultanchorstrings || this.defaultanchorstrings.length === 0) {
      await this.loadDefaultAnchorStrings();
    }

    this.defaultanchorstrings.forEach((anchor: any) => {
      const exists = this.listItems.some((item) => item["Anchor String"] === anchor.anchorString);
      anchor.checked = exists;

      if (exists && !this.tempData.some((t) => t.anchorString === anchor.anchorString)) {
        this.tempData.push(anchor);
      }
    });
    //added here to load the document content if not fetched - to validate anchors
    if (!this.cachedDocumentContent || this.cachedDocumentContent.trim().length === 0) {
      const content = await this.extractDocumentText();
      this.cachedDocumentContent = content.toLowerCase();
    }
  }
  closeModal() {
    this.isModal = false;
  }

  editEsignHander(template: any, index: any) {
    this.checkboxes.forEach((checkbox: ElementRef) => {
      (checkbox.nativeElement as HTMLInputElement).checked = false;
    });
    this.toggleFieldsVisibility(template, index);
    this.showEditEsign = true;
    this.EditTemplate(template);
  }

  onEffectiveDateChange(event: any, index: number) {
    if (this.files[index]) {
      this.files[index].effectiveDate = event;

      // Optional: Validate that effective date is before end date (only if both dates exist)
      if (this.files[index].endDate && event && event > this.files[index].endDate) {
        this.bbToaster.show_warn("Effective date cannot be after end date");
        // Reset if invalid
        this.files[index].effectiveDate = null;
      }
    }
  }

  onEndDateChange(event: any, index: number) {
    if (this.files[index]) {
      this.files[index].endDate = event;

      // Optional: Validate that end date is after effective date (only if both dates exist)
      if (this.files[index].effectiveDate && event && event < this.files[index].effectiveDate) {
        this.bbToaster.show_warn("End date cannot be before effective date");
        // Reset if invalid
        this.files[index].endDate = null;
      }
    }
  }

  // Add this method to your component class
  private formatDateForBackend(date: Date): any {
    if (!date) return null;

    // Create a new date object to avoid modifying the original
    const localDate = new Date(date);

    // Get the local date components (this preserves the selected date)
    const year = localDate.getFullYear();
    const month = localDate.getMonth();
    const day = localDate.getDate();

    const utcDate = new Date(Date.UTC(year, month, day));

    // Return in ISO format without time (just date)
    return utcDate.toISOString();
  }

  async saveExecutedContracts() {
    try {
      this.bbLoader.showLoader();
      if (!this.files || this.files.length === 0) {
        this.bbToaster.show_error("Please select a file to upload.");
        return;
      }

      // Process each file individually
      for (let i = 0; i < this.files.length; i++) {
        const file = this.files[i];
        console.log('this.files index: ', i);
        console.log('this.files: ', this.files[i]);

        // Validate that document type is selected for each file
        if (!file.docuemntTypeID) {
          this.bbToaster.show_error(
            `Please select a document type for file: ${file.data.name}`
          );
          return;
        }

        // Prepare form data for file storage
        const formData = new FormData();
        let opportunityName = this.showExecuteContract?.opportunityName;
        let companyName = this.bbStore.getItem("companyName") || "";

        companyName = companyName.trim().replace(/\s+/g, "-");
        opportunityName = opportunityName.trim().replace(/\s+/g, "-");

        formData.append("file", file.data);
        formData.append("path", `crm/${companyName}/opportunity/${opportunityName}/executed-contracts`);
        formData.append("fileName", file.data.name);
        formData.append("companyId", this.companyId || this.compID);
        // Upload file to storage
        const uploadResponse: any = await firstValueFrom(this.sharePoint.uploadFileToStorage(formData));

        if (!uploadResponse || !uploadResponse.path) {
          throw new Error(`File upload failed for: ${file.data.name}`);
        }

        // Use per-file dates - handle null values and preserve exact date
        const effectiveDate = file.effectiveDate ? this.formatDateForBackend(file.effectiveDate) : null;
        const endDate = file.endDate ? this.formatDateForBackend(file.endDate) : null;

        // Prepare document payload according to your API structure
        const documentPayload = {
          docuemntTypeID: {
            _id: file.docuemntTypeID,
          },
          filepath: uploadResponse.path,
          fileName: file.data.name,
          fromDate: effectiveDate,
          dueDate: endDate,
          categoryID: file?.selectedCategory || null,
          productID: file?.productID || null,
          opportunityId: this.showExecuteContract?.id || null,
          IDs: {
            companyId: this.showExecuteContract?.compId || this.companyId || this.compID || null,
          },
        };

        try {
          // Save document details to backend
          const documentResponse = await firstValueFrom(this.categoryService.saveDocumentDetails([documentPayload]));

          if (documentResponse.success) {
            this.bbToaster.show_success(
              `Executed contract saved successfully for: ${file.data.name}`
            );
            this.ReloadContract();
          } else {
            this.bbToaster.show_error(`Failed to save document: ${file.data.name}`);
          }
        } catch (backendError: any) {
          // Handle duplicate file error specifically
          if (backendError.status === 409) {
            const errorMessage = backendError.error?.message || "A document with this filename already exists";
            this.bbToaster.show_error(`${errorMessage}: ${file.data.name}`);
          } else if (backendError.status === 404) {
            this.bbToaster.show_error("Status not found. Please contact administrator.");
          } else {
            const errorMsg = backendError.error?.message || backendError.message || "Error saving executed contract";
            this.bbToaster.show_error(`${errorMsg}: ${file.data.name}`);
          }
          console.error("Backend error:", backendError);
        }
      }

      // Reset form and clear files after processing all
      this.files = [];
      this.cancelExecutedContracts.emit();
    } catch (error: any) {
      console.error("Error saving executed contract:", error);
      this.bbToaster.show_error(
        error.message || "Error saving executed contract. Please try again."
      );
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  onCancelExecutedContracts() {
    this.cancelExecutedContracts.emit();
  }

  ReloadContract() {
    this.onReloadContract.emit();
  }
}
