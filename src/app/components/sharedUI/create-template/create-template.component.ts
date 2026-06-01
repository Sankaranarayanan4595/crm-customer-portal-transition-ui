import { Component, Renderer2, ElementRef, ChangeDetectorRef, inject } from "@angular/core";
import { BBLoaderService, BbStoreService, BBAuthService, BBToastService, DataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { NgxDropzoneModule } from "ngx-dropzone";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { IDropdownSettings, NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { NgSelectModule } from "@ng-select/ng-select";
import { DocumentTypeName } from "projects/customer-management-ui/shared/interface/masterInterface";
import JSZip from "jszip";
import { CommonModule } from '@angular/common';

import * as mammoth from 'mammoth';
import Tesseract from 'tesseract.js';

import * as pdfjsLib from "pdfjs-dist";
(pdfjsLib as any).GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";


import { DocubeeService } from "projects/customer-management-ui/shared/docubee/docubee.service";
import { MastersService } from "projects/customer-management-ui/shared/masters/masters.service";
import { SharepointService } from "projects/customer-management-ui/shared/sharepoint/sharepoint.service";
import { firstValueFrom } from "rxjs";
import { RolesData } from "projects/customer-management-ui/shared/interface/masterInterface";
import { HtmlPreviewComponent } from "../html-preview/html-preview.component";
@Component({
  selector: "app-create-template",
  imports: [
    DataTableComponent,
    NgxDropzoneModule,
    NgMultiSelectDropDownModule,
    NgSelectModule,
    FormsModule,
    ReactiveFormsModule,
    HtmlPreviewComponent,
    CommonModule
  ],
  templateUrl: "./create-template.component.html",
  styleUrl: "./create-template.component.scss"
})
export class CreateTemplateComponent {
  private renderer = inject(Renderer2);
  private element = inject(ElementRef);
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoriesService);
  private masterService = inject(MastersService);
  private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private docubee = inject(DocubeeService);
  private osharepoint = inject(SharepointService);
  private bbAuthService = inject(BBAuthService);
  private cdRef = inject(ChangeDetectorRef);

  isModal: boolean = false;
  selectedCompany: string[] = [];
  tempdocuments: any;
  docuploadid: any;
  templates: any;
  docuemntTypeID: any;
  AnchorStrings: any[] = [];
  templateid: any;
  customtempid: any;
  editmode: boolean = false;
  fileeditmode: boolean = false;
  showEditEsign: boolean = false;
  defaultanchorstrings: any;
  DefaultAnchorStrings: any;
  oCategoryID: any;
  DocumentTypes: any;
  closeViewModal(event: boolean) {
    this.showViewDocModal = event;
  }
  userForm!: FormGroup;
  FieldSet!: FormGroup;
  listItems: any[] = [];
  tempData: any[] = [];
  height!: number;
  width!: number;
  docubeeList: any[] = [];
  rolesData: any;
  templateNameExists: boolean = false;
  PreviewDocument!: { fileBlob: Blob; fileName: any; templateName: any; };
  showViewDocModal: boolean = false;
  dropzoneHtml: any;
  categories: any[] = [];
  products: any[] = [];
  companyList: any[] = [];
  dropdownSetting: IDropdownSettings = {};
  userdropdownSetting: IDropdownSettings = {};
  files: any[] = [];
  hideFieldSet: boolean = true;
  uploadDocumentID!: string;
  userId!: string;
  compID!: string;
  isEditMode = false;
  editIndex: number | null = null;
  extractedContent: string = '';
  cachedDocumentContent: string = '';

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
    this.userForm = this.fb.group({
      industry: [""],
      selectedProduct: [null],
      templateName: ["", Validators.required],
      documenttype: ["", Validators.required],

      // selectedCompany: [null, Validators.required],
    });

    this.userForm.get("industry")?.setValue(null);
    this.FieldSet.get("fieldType")?.setValue(null);
    this.FieldSet.get("roleType")?.setValue(null);
  }


  async ngOnInit(): Promise<void> {
    this.userId = this.bbStore.getItem("userId") || this.bbStore.getItem("userid");
    this.compID = this.bbStore.getItem("selectedCompanyId");
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
    await this.loadDoumentTypes();
    await this.onCompanyChange();
    // this.loadCategories();
    await this.loadDefaultAnchorStrings();
    await this.loadDocubeeDetails();
    await this.getAllMailTemplates();
    await this.loadCompanyList();
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
    this.userForm = this.fb.group({
      industry: [""],
      selectedProduct: [null],
      templateName: ["", Validators.required],
      documenttype: ["", Validators.required],

      // selectedCompany: [null, Validators.required],
    });

    this.userForm.get("industry")?.setValue(null);
    this.FieldSet.get("fieldType")?.setValue(null);
    this.FieldSet.get("roleType")?.setValue(null);
  }
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
    edit: true,
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
      const anchorToUncheck = this.DefaultAnchorStrings.find((a: { anchorString: any; }) => a.anchorString === deletedAnchorString);
      if (anchorToUncheck) {
        anchorToUncheck.checked = false;
      }
      this.bbToaster.show_success("Deleted Successfully.");
    } else if (data.type == "edit") {
      this.EditAnchorStrings(data.data);
    }
  }
  recive_data(data: any) {
    console.log('data: ', data);
    if (data.type == "delete") {
      this.delete(data.data);
    } else if (data.type == "view") {
      this.getDoumentView(data.data);
    }

    else if (data.type == "edit") {
      this.EditTemplate(data.data);
    }
  }

  drpDocumentType(event: any) {
    console.log('event: ', event);
    this.docuemntTypeID = event;
  }
  async loadDoumentTypes() {
    const docTypeData: DocumentTypeName = await firstValueFrom(this.masterService.allActiveDocumentTypes());
    this.DocumentTypes = docTypeData.data;
    console.log('Before assignment:', this.DocumentTypes.length);
    this.DocumentTypes = docTypeData.data.sort((a: { cDocument_Type: string; }, b: { cDocument_Type: any; }) =>
      a?.cDocument_Type?.localeCompare(b?.cDocument_Type)
    );
    console.log('After assignment:', this.DocumentTypes.length);
  }
  async EditTemplate(template: any) {
    this.showEditEsign = true;
    this.DragDropFn();
    this.editmode = true;
    this.bbLoader.showLoader();

    try {
      this.bbLoader.showLoader();
      const res = await firstValueFrom(this.docubee.getTemplateDetails(template._id));

      this.templates = res.data;
      this.fileeditmode = false;
      console.log("this.templates", this.templates);
      this.userForm.patchValue({
        templateName: this.templates?.cTemplate_Name
      });
      this.customtempid = this.templates?._id;
      this.oCategoryID = this.templates?.oCategoryID;
      await this.onIndustryChange(this.templates?.oCategoryID)
      this.uploadDocumentID = this.templates?.cDocubeeUploadId;
      this.listItems = [];
      this.userForm.patchValue({
        industry: this.oCategoryID,
        selectedProduct: this.templates?.oProduct_Id?._id
      });
      this.loadDefaultAnchorStrings();
      this.docuemntTypeID = this.templates?.oDocumentTypeID

      this.userForm.patchValue({
        documenttype: this.templates?.oDocumentTypeID && typeof this.templates.oDocumentTypeID !== 'string'
          ? this.templates.oDocumentTypeID._id
          : this.templates?.oDocumentTypeID,
      });
      console.log("this.docuemntTypeID", this.docuemntTypeID);
      this.tempData = this.templates?.AnchorStrings || [];
      this.reassignData();

      // this.tempData=this.templates?.AnchorStrings;
      //     // Patch value into the form control
      //     this.userForm.patchValue({
      //       templateName: this.templates.cTemplate_Name
      //     });


      this.cdRef.detectChanges();
    } catch (err) {
      console.error(err);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async onFileSelectedChange(event: any) {
    if (event && event._id !== "0") {
      try {

        const matchedtemplate = this.tempData.find(
          (cat) => String(cat._id).trim() == String(event._id).trim()
        );

        console.log("file matchedtemplate", matchedtemplate);
        const uploadId = matchedtemplate.cDocubeeUploadId;
        const response = await this.docubee.GetDocubeeFileDetails(uploadId);

        console.log("file response", response);

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
        console.log("tempdocuments", this.tempdocuments);
        this.products = await this.categoryService.getProductsByCategory(event._id);
      } catch (error) {
        console.error("Error fetching products by category:", error);
      }
    } else {
      this.products = [];
    }
  }
  // async loadCategories(): Promise<void> {
  //   try {
  //     this.categories = await this.categoryService.getCategoriesbyUserCompany(this.companyList);
  //   } catch (error) {
  //     console.error("Error fetching categories:", error);
  //   }
  // }
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

  async onFileSelect(event: any) {
    try {
      this.cachedDocumentContent = '';
      this.fileeditmode = true;
      this.bbLoader.showLoader();
      const allowedExtensions = ["docx", "pdf"];
      for (let i = 0; i < event.addedFiles.length; i++) {
        let file = event.addedFiles[i];

        let fileName = file.name.replace(/'/g, "_");
        const modifile = new File([file], fileName.toString(), {
          type: file.type,
        });
        function formatExtensions(extensions: string[]): string {
          if (extensions.length === 0) {
            return "";
          }
          if (extensions.length === 1) {
            return extensions[0] ?? "";
          }
          const lastExtension = extensions.pop() ?? "";
          return `${extensions.join(", ")} and ${lastExtension}`;
        }

        const fileExtension = fileName.split(".").pop()?.toLowerCase();
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
        // if (fileExtension === "doc") {

        //         try {
        //          const formData = new FormData();
        // formData.append("file", file, file.name);

        // const convertedBlob = await firstValueFrom(
        //   this.osharepoint.convertDocToPdf(formData)
        // );

        // // Convert to PDF file
        // fileName = fileName.replace(/\.doc$/i, ".pdf");
        // file = new File([convertedBlob], fileName, { type: "application/pdf" });

        //         } catch (err) {
        //           console.error("DOC to PDF conversion failed", err);
        //           this.bbToaster.show_error("Failed to convert DOC to PDF.");
        //           continue;
        //         }
        //       }
        const data = await this.readFileAsDataURL(file);
        const headerType = await this.osharepoint.getMimeType(file.name);
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
                  console.log('Keeping anchor and adding to updatedListItems:', listItem);
                  updatedListItems.push(listItem);
                  return true;
                } else {
                  console.warn('Anchor not found in document and will be removed:', element.anchorString);
                  return false;
                }
              });

              this.tempData = updatedTempData;
              this.listItems = updatedListItems;
            }
            //           this.listItems=[];           
            //             this.tempData=[];
            //               this.DefaultAnchorStrings = this.DefaultAnchorStrings.map((anchor: any) => ({
            //   ...anchor,
            //   checked: false
            // }));   this.loadDefaultAnchorStrings();

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
      let content = '';
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const arrayBuffer = await file.arrayBuffer();

      if (fileExtension === 'pdf') {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const extracted = text.items.map((item: any) => item.str).join(" ");
          content += extracted + ' ';
        }
      } else if (fileExtension === 'docx') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;

        // Add header extraction if needed using JSZip (as you already have)
      }

      this.extractedContent = content.toLowerCase();
      this.cachedDocumentContent = this.extractedContent;
      console.log("📄 Cached extracted content:", this.extractedContent.slice(0, 300));
    } catch (err) {
      console.error("❌ Error extracting document text:", err);
      this.extractedContent = '';
    }
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
    this.editmode = false;
    this.loadDefaultAnchorStrings();
    this.files = [];
    this.userForm.reset();
    this.FieldSet.reset();
    if (this.dropzoneHtml) {
      this.renderer.addClass(this.dropzoneHtml, "activeDragandDrop");
    }
    this.listItems = [];
    this.tempData = [];
    this.uploadDocumentID = "";
    this.closeTempDocument();
  }
  logFormValidationErrors(iControls: any) {
    Object.keys(iControls.controls).forEach(key => {
      const controlErrors = iControls.get(key)?.errors;
      if (controlErrors) {
        iControls.get(key)?.markAsTouched();
      }
    });
  }

  async SaveTemplate() {

    try {
      this.bbLoader.showLoader();
      if (this.userForm.valid) {
        // const anchorStrings = this.tempData.map(item => item.anchorString);

        // for (const anchor of anchorStrings) {
        //   const anchorExists = await this.checkAnchorInDocument(anchor);

        //   if (!anchorExists) {
        //     this.bbToaster.show_error(
        //       `Anchor string "${anchor}" not found in the uploaded document.`,
        //       "top-end",
        //       3000,
        //       "300px"
        //     );
        //     return;
        //   }
        // }
        // const selectedCompany = this.userForm.controls["selectedCompany"].value;
        // const selectedCompanyId = selectedCompany ? selectedCompany.map((company: any) => company._id) : [];
        const checkedAnchors = this.DefaultAnchorStrings?.filter((anchor: any) => anchor.checked === true) || [];
        console.log('Checked Anchors:', checkedAnchors);
        console.log('Checked this.tempData:', this.tempData);
        let cleanedCheckedAnchors = [];
        const missingAnchors: string[] = [];
        for (const checkedAnchor of checkedAnchors) {
          const fullAnchor = this.DefaultAnchorStrings.find((item: any) => item._id === checkedAnchor._id);

          const existsInDoc = await this.checkAnchorInDocument(fullAnchor.anchorString);

          if (!existsInDoc) {
            missingAnchors.push(fullAnchor.anchorString);
            continue;
          }

          cleanedCheckedAnchors.push({
            anchorString: fullAnchor.anchorString,
            name: fullAnchor.name,
            formRoleId: fullAnchor.formRoleId,
            type: fullAnchor.type || 'text',
            required: fullAnchor.required ?? false,
            removeAnchorString: fullAnchor.removeAnchorString ?? false,
            height: fullAnchor.height || 24,
            width: fullAnchor.width || 210,
          });
        }

        if (missingAnchors.length > 0) {
          this.bbToaster.show_error(`The document does not contan an anchor string: ${missingAnchors.join(", ")}`);
          return;
        }
        cleanedCheckedAnchors = cleanedCheckedAnchors.map((item: any) => {
          const { _id, ...rest } = item;
          return rest;
        });

        const tempData = [
          ...this.tempData,
          ...cleanedCheckedAnchors
        ];
        if (tempData.length == 0) {
          this.bbToaster.show_error("No Data added");
          return;
        }


        const selprod = this.products?.find((val) => val._id === this.userForm.get("selectedProduct")?.value);

        const req = {
          docuemntTypeID: this.docuemntTypeID,
          fieldDetails: tempData,
          inputDocumentId: this.uploadDocumentID,
          cTemplate_Name: this.userForm.controls["templateName"]?.value,
          fileName: this.files[0].name,
          industry: this.userForm.get("industry")?.value?._id,
          selectedproduct: selprod?._id,
        };
        console.log("new req", req);
        const response = await this.docubee.docubeePlaceUpdateFieldsOnDocument(req);
        if (response.status) {
          this.bbToaster.show_success("Template Details Created Successfully");
          this.resetFileUpload();
          this.FieldSet.reset();
          this.bbAuthService.datatableSubject.next('clear');
          this.loadDocubeeDetails();
          this.tempData = [];
          this.listItems = [];
        } else {
          this.bbToaster.show_error(response.message);
        }
      } else {
        if (!this.userForm.valid) {
          const invalidFields = Object.keys(this.userForm.controls).filter(control => {
            return this.userForm.get(control)?.invalid;
          });
          console.warn('Invalid Fields:', invalidFields);
        }
        this.logFormValidationErrors(this.userForm);
        this.bbToaster.show_error("Please enter the required fields");
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async updateTemplate(save: 'save' | 'update') {
    try {
      this.bbLoader.showLoader();
      const templateName = this.userForm.get("templateName")?.value?.trim();
      if (!templateName) {
        this.bbToaster.show_error("Template Name is required.");
        return;
      }
      const DocumentName = this.userForm.get("documenttype")?.value?.trim();
      if (!DocumentName) {
        this.bbToaster.show_error("Document Type is required.");
        return;
      }
      if (this.userForm.valid) {
        if (save === "save") {
          const response = await firstValueFrom(this.masterService.checkTemplateName(templateName));
          if (response.exists) {
            this.userForm.get("templateName")?.setErrors({ exists: true });
            this.bbToaster.show_error("Template name already exists.");
            return;
          }
        }
        else {

          const isDuplicate = this.docubeeList.some(item =>
            item["Template Name"]?.trim()?.toLowerCase() === templateName.trim()?.toLowerCase() &&
            item["_id"] !== this.customtempid
          );
          if (isDuplicate) {
            this.userForm.get("templateName")?.setErrors({ exists: true });
            this.bbToaster.show_error("Another template with this name already exists.");
            return;
          }

        }
        const checkedAnchors = this.DefaultAnchorStrings?.filter((anchor: any) => anchor.checked === true) || [];
        console.log('Checked Anchors:', checkedAnchors);
        console.log('Checked this.tempData:', this.tempData);


        let cleanedCheckedAnchors = checkedAnchors.map((fullAnchor: any) => ({
          anchorString: fullAnchor.anchorString,
          name: fullAnchor.name,
          formRoleId: fullAnchor.formRoleId,
          type: fullAnchor.type || 'text',
          required: fullAnchor.required ?? false,
          removeAnchorString: fullAnchor.removeAnchorString ?? false,
          height: fullAnchor.height || 24,
          width: fullAnchor.width || 210,
        }));

        // if (missingAnchors.length > 0) {
        //   this.bbToaster.show_error(`The following anchor strings are not found in the document: ${missingAnchors.join(", ")}`);
        //   return;
        // }


        cleanedCheckedAnchors = cleanedCheckedAnchors.map((item: any) => {
          const { _id, ...rest } = item;
          return rest;
        });

        const tempData = [
          ...this.tempData,
          ...cleanedCheckedAnchors
        ];

        if (tempData.length == 0) {

          this.bbToaster.show_error("No Data added");
          return;
        }
        const selprod = this.products?.find((val) => val?._id === this.userForm.get("selectedProduct")?.value);

        const req = {
          fieldDetails: tempData,
          docuemntTypeID: this.userForm.get("documenttype")?.value,
          inputDocumentId: this.uploadDocumentID,
          fileName: this.files[0]?.name || this.templates.cFile_Name,
          industry: this.userForm.get("industry")?.value?._id,
          selectedproduct: selprod?._id,
          customtempid: save == "update" ? this.customtempid : undefined,
          cTemplate_Name: this.userForm.get("templateName")?.value || ''
        };

        console.log("new req", req);

        const response = await this.docubee.docubeePlaceUpdateFieldsOnDocument(req);



        if (response.status) {
          if (save === "update") {
            this.bbToaster.show_success("Template Details updated Successfully");
          } else {
            this.bbToaster.show_success("Template Details saved Successfully");
          }

          this.resetFileUpload();
          this.FieldSet.reset();
          this.bbAuthService.datatableSubject.next('clear');
          this.loadDocubeeDetails();
          this.loadDefaultAnchorStrings();
          this.tempData = [];
          this.listItems = [];
          this.showEditEsign = false;
        } else {

          const errorMsg = response.message || "Something went wrong. Please check anchor strings.";
          this.bbToaster.show_error(errorMsg);
        }
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


  async checkAnchorInDocument(anchor: string): Promise<boolean> {
    // ✅ Use cached content if available
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

        arrayBuffer = fileResponse instanceof Blob
          ? await fileResponse.arrayBuffer()
          : fileResponse;

        fileExtension = this.templates.cFile_Name.split(".").pop()?.toLowerCase();
      } else {
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
          const extracted = text.items.map((item: any) => item.str).join(" ").trim();

          content += extracted.length > 10 ? extracted + " " : await this.runOCRonPDFPage(page) + " ";
        }
      }

      // -------- Word Extraction --------
      else if (["docx", "doc"].includes(fileExtension)) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        content = result.value;

        const zip = await JSZip.loadAsync(arrayBuffer);
        const headerFiles = Object.keys(zip.files).filter(f => /^word\/header\d+\.xml$/.test(f));
        let headerText = "";

        for (const fileName of headerFiles) {
          const xml = await zip.file(fileName)?.async("string");
          const matches = xml?.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
          if (matches?.length) {
            headerText += matches.map(t => t.replace(/<\/?w:t[^>]*>/g, "")).join(" ") + "\n";
          }
        }

        content = headerText + content;
      }

      else {
        console.warn("Unsupported file extension:", fileExtension);
        return "";
      }

      console.log("Extracted (truncated):", content.slice(0, 300));
      return content;

    } catch (error) {
      console.error("Error reading document:", error);
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
    const result = await Tesseract.recognize(dataUrl, 'eng');
    // console.log("result.data.text", result.data.text);
    return result.data.text;



  }
  async addDataToList() {

    if (this.FieldSet.valid) {
      const anchor = this.FieldSet.get("anchorString")?.value.trim();

      if (!anchor) {
        this.bbToaster.show_error("Anchor string cannot be empty.");
        return;
      }

      const Field = {
        anchorString: this.FieldSet.get("anchorString")?.value.trim(),
        name: this.FieldSet.get("fieldLabel")?.value.trim(),
        type: this.FieldSet.get("fieldType")?.value.trim(),
        formRoleId: this.FieldSet.get("roleType")?.value.trim(),
        height: this.FieldSet.get("height")?.value,
        width: this.FieldSet.get("width")?.value,
        removeAnchorString: this.FieldSet.get("removeanchorActive")?.value,
        required: this.FieldSet.get("fieldRequired")?.value
      };

      //  const isDuplicate = this.tempData.some((item, i) =>
      //         item.anchorString === Field.anchorString && (!this.isEditMode || i !== this.editIndex)
      //       );

      const isDuplicate = this.tempData.some((item, index) =>
        item.anchorString === Field.anchorString && (!this.isEditMode || index !== this.editIndex)
      );


      if (isDuplicate) {
        this.bbToaster.show_error("Duplicate anchor string.");
        return;
      }
      const anchorExists = await this.checkAnchorInDocument(anchor);
      if (!anchorExists) {
        this.bbToaster.show_warn(`The document does not contan an anchor string "${anchor}".`);
        return;
      }


      // if (this.tempData.filter((item) => item.anchorString === Field.anchorString).length > 0) {
      //   this.bbToaster.show_error("duplicate anchor String");
      // } else {
      //   this.tempData.push(Field);
      // }


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
    this.editIndex = this.listItems.findIndex(item => item.anchorString === fieldData.anchorString);
    this.FieldSet.patchValue({
      anchorString: fieldData["Anchor String"] || '',
      fieldLabel: fieldData["Field Label"] || '',
      fieldType: fieldData["Field Type"] || '',
      roleType: fieldData["Form role"] || '',
      height: fieldData["Height"] || 24,
      width: fieldData["Width"] || 210,
      removeanchorActive: !!fieldData["Remove Anchor String"],
      fieldRequired: !!fieldData["Required"]
    });

    const anchorInput = document.getElementById('anchorString');
    if (anchorInput) {
      anchorInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      anchorInput.focus();
    }
  }
  ClearDataToList() {
    this.FieldSet.reset();
    this.isEditMode = false;
    this.editIndex = null;
    this.cachedDocumentContent = '';
  }
  delete(data: any) {
    const _id = data["_id"];
    firstValueFrom(this.masterService.beActiveZeroDocubeeList(_id))
      .then((_response) => {
        this.bbToaster.show_success("Docubee template deactivated successfully.");
        this.listItems = this.listItems.filter((item: any) => item._id !== _id);
        this.reassignData();
        this.bbAuthService.datatableSubject.next('clear');
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

    if (this.tempData.length > 0) {
      this.hideFieldSet = false;
      this.cdRef.detectChanges();
    }
  }

  async onAnchorCheckedChange(event: any, anchor: any): Promise<void> {
    const isChecked = event.target.checked;

    const alreadyExists = this.listItems.some(
      item => item["Anchor String"] === anchor.anchorString
    );

    // If anchor exists in listItems and user tries to uncheck
    if (alreadyExists && !isChecked) {
      anchor.checked = false;
      this.tempData = this.tempData.filter(item => item.anchorString !== anchor.anchorString);
      this.reassignData();
      // this.hideFieldSet = this.tempData.length === 0;
      this.cdRef.detectChanges();
      console.log("Unchecked existing anchor:", anchor.anchorString);
      return;
    }

    //  If anchor exists and user tries to re-check — block it
    if (alreadyExists && isChecked) {
      // console.warn(" Duplicate anchor string detected:", anchor.anchorString);
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

      const existsInTemp = this.tempData.some(item => item.anchorString === anchor.anchorString);
      if (!existsInTemp) {
        this.tempData.push(anchor);
        // console.log("Added to tempData:", anchor.anchorString);
      }
    } else {
      this.tempData = this.tempData.filter(item => item.anchorString !== anchor.anchorString);
      // console.log("Removed from tempData:", anchor.anchorString);
    }

    this.reassignData();
    // this.hideFieldSet = this.tempData.length === 0;
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

  async templateNameCheck(event: Event): Promise<void> {
    try {
      this.bbLoader.showLoader();
      const templateName = (event.target as HTMLInputElement).value;
      if (templateName) {

        if (!this.editmode) {
          const response = await firstValueFrom(this.masterService.checkTemplateName(templateName));
          if (response.exists) {
            this.userForm.get("templateName")?.setErrors({ exists: true });
            this.userForm.get("templateName")?.setValue("");
            this.bbToaster.show_error("Template name already exists.");
            return;
          } else {
            this.userForm.get("templateName")?.setErrors(null);
          }
        }

      }
    } catch (error) {
      console.error("Error checking template name:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }



  async loadDefaultAnchorStrings(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      this.DefaultAnchorStrings = await this.docubee.beActiveAnchorStringList();
      // console.log("this.DefaultAnchorStrings", this.DefaultAnchorStrings);
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
    finally {
      this.bbLoader.hideLoader();
    }
  }
  async loadDocubeeDetails(): Promise<void> {
    try {
      // this.bbAuthService.datatableSubject.next('clear');
      this.bbLoader.showLoader();
      this.docubeeList = await this.docubee.getDocubeeList();
      console.log(" this.docubeeList", this.docubeeList);

      const filteredData = this.docubeeList.map((item: { [x: string]: any }) => {
        return {
          "Template Name": item["cTemplate_Name"],
          "Industry Name": item["categoryName"],
          "Product Name": item["productName"],
          "File Name": item["cFile_Name"],
          "Document Type": item["cDocument_Type"],
          "Docubee Upload ID": item["cDocubeeUploadId"],
          "Docubee FieldSet ID": item["cDocubeeFieldSetId"],
          "Created On": item["Created At"],
          _id: item["_id"],
        };
      });
      this.docubeeList = filteredData;
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async getAllMailTemplates() {
    try {
      this.bbLoader.showLoader();
      const rolesDataVal: RolesData = await firstValueFrom(this.masterService.getAllRoles());
      this.rolesData = rolesDataVal.data;
    } catch (error) {
      console.error("Error fetching mail templates:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  getDoumentView(rowdata: any) {

    this.doubeedownloadFile(rowdata["File Name"], rowdata["Docubee Upload ID"], rowdata["Template Name"]);
  }

  async doubeedownloadFile(FileName: any, DocumentID: any, templateName: any) {
    try {
      this.bbLoader.showLoader();
      const fileUrl = {
        filePath: `${FileName}`,
        documentID: `${DocumentID}`,
      };
      console.log("DocumentID", DocumentID);
      const fileResponse = await firstValueFrom(this.osharepoint.getFileFromDoubee(fileUrl));
      console.log("FileName", FileName.split(".")[0]);
      if (FileName.split(".")[1] == "pdf") {

        this.PreviewDocument = {
          fileBlob: fileResponse,
          fileName: FileName,
          templateName: templateName,
        };
        this.showViewDocModal = true;
      }
      else {
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
    // First sync checked flags based on existing list
    this.DefaultAnchorStrings.forEach((anchor: any) => {
      const exists = this.listItems.some(item => item["Anchor String"] === anchor.anchorString);
      // console.log('exists: ', exists);
      anchor.checked = exists;

      // Also push to tempData if missing
      if (exists && !this.tempData.some(t => t.anchorString === anchor.anchorString)) {
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
}
