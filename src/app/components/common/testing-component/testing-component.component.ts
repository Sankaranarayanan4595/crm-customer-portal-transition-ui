import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { BBLoaderService, BBToastService, DataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { CustomerService } from 'projects/customer-management-ui/shared/customer/customer.service';
import { MastersService } from 'projects/customer-management-ui/shared/masters/masters.service';
import { firstValueFrom } from 'rxjs';
import { FormioModule } from '@formio/angular';
import { FormsService } from 'projects/BBForms-ui/src/public-api';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { OpportunitiesService } from 'projects/customer-management-ui/shared/opportunities/opportunities.service';
@Component({
  selector: 'app-testing-component',
  standalone: true,
  imports: [TableModule, InputTextModule, FormioModule, DataTableComponent, NgSelectModule, FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './testing-component.component.html',
  styleUrl: './testing-component.component.scss'
})
export class TestingComponentComponent implements OnInit {
  private masterService = inject(MastersService);
  private customerService = inject(CustomerService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private fb = inject(FormBuilder);
  private formService = inject(FormsService);
  private OpportunitiesService = inject(OpportunitiesService);

  private observer!: MutationObserver;
  formData: any;
  table: any;
  filterForm: FormGroup;
  listItems: any;
  isEditMode = false;
  rawData: any;
  action_fields = {
    delete: false,
    edit: false,
    view: false,
    copy: false,
    manager_type: false,
    email: false,
    restrict_view: false,
  };
  position = "last";
  Desc_colum = {
    show: false,
    header: ["Body of the mail"],
  };
  collectionGroup: any;
  usersGroup: any;
  image_colum = {
    show: false,
    header: "Global",
    url: "../../../assets/icons/download.png",
  };

  button_colum = {
    header: "Status",
    backgroud_colour: "red",
  };
  products = [{
    id: '1000',
    code: 'f230fh0g3',
    name: 'Bamboo Watch',
    description: 'Product Description',
    image: 'bamboo-watch.jpg',
    price: 65,
    category: 'Accessories',
    quantity: 24,
    rating: 5
  }];
  @ViewChild('setFormIoWidth', { static: false }) setFormIoWidth !: ElementRef;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    this.filterForm = this.fb.group({
      collection: ["0"],
      user: ["0"],
    })
  }
  selectedFile: File | null = null;
  message = '';
  changestatus = '';
  typeOfUpload = '';
  isUploading = false;
  isUploadingc = false;

  ngOnInit() {
    this.formService.getFormsByID("68775ada15024a491eb0ee25").subscribe((response: any) => {
      this.formData = response
    })
    this.getCRMLogsAll();
  }
  // ngAfterViewInit() {
  //   debugger
  //   // Attempt 1: Use Form.io's render event
  //   const formioElement = this.setFormIoWidth.nativeElement;
  //     const tableComponent = formioElement.querySelector('.formio-component.formio-component-table .table');

  //   if (tableComponent) {
  //     tableComponent.addEventListener('render', () => {
  //       this.adjustTableWidth();
  //     });
  //   }

  //   // Attempt 2: Fallback timeout (if render event fails)
  //   setTimeout(() => {
  //     this.adjustTableWidth();
  //   }, 1000); // 1 second delay (adjust as needed)
  // }

  // adjustTableWidth() {
  //   const formioElement = this.setFormIoWidth.nativeElement;
  //   const tableComponent = formioElement.querySelector('.formio-component.formio-component-table .table');

  //   if (tableComponent && this.formData.components[0].rows.length > 4) {
  //     tableComponent.classList.add('wide-table');
  //   }
  // }


  ngAfterViewInit() {
    this.waitForTableRender();
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }
  //access shadow dom table 
  waitForTableRender() {
    const targetNode = this.setFormIoWidth.nativeElement;
    this.observer = new MutationObserver((_mutations, obs) => {
      const table = targetNode.querySelector('.formio-component-table .table');
      if (table) {
        this.adjustTableWidth(table);
        obs.disconnect(); // Stop observing once found
      }
    });
    this.observer.observe(targetNode, {
      childList: true,  // Watch for added/removed elements
      subtree: true     // Check all nested elements
    });
  }

  adjustTableWidth(table: HTMLElement) {
    if (this.formData.components[0]?.rows?.length < 5) {
      table.classList.add('fit-width-tble');
    }
  }


  resetFilter() {
    const filteredData = this.rawData.map((item: { [x: string]: any }) => ({
      "collectionName": item["collectionName"],
      "From": JSON.stringify({ ...item["originalData"] }),
      'To': JSON.stringify({ ...item["updatedData"] }),
      _id: item["_id"],
      'updatedBy': item["updatedBy"],
    }));
    this.table = filteredData;
    this.listItems = this.table;
    this.filterForm.patchValue({
      collection: ["0"],
      user: ["0"],
    });
  }

  async applyFilter() {
    try {
      const collection = this.filterForm.get('collection');
      const user = this.filterForm.get('user');

      if (!collection || !user) return;

      const filteredData = this.rawData.map((item: { [x: string]: any }) => ({
        collectionName: item["collectionName"],
        From: JSON.stringify({ ...item["originalData"] }),
        To: JSON.stringify({ ...item["updatedData"] }),
        _id: item["_id"],
        updatedBy: item["updatedBy"],
      }));

      if (collection.value === '0' && user.value === '0') {
        this.table = filteredData;
      } else {
        this.table = filteredData.filter((item: any) =>
          (collection.value === '0' || item["collectionName"] === collection.value) &&
          (user.value === '0' || item["updatedBy"] === user.value)
        );
      }
      this.listItems = this.table;
    } catch (error) {
      console.error('Error:', error);
    }
  }


  async getCRMLogsAll() {
    try {
      const logs = await firstValueFrom(this.masterService.getAllCRMAuditLogs());
      this.rawData = logs.data;
      const filteredData = this.rawData.map((item: { [x: string]: any }) => ({
        "collectionName": item["collectionName"],
        "From": JSON.stringify({ ...item["originalData"] }),
        'To': JSON.stringify({ ...item["updatedData"] }),
        _id: item["_id"],
        'updatedBy': item["updatedBy"],
      }));
      this.table = filteredData;
      this.listItems = this.table;
      this.collectionGroup = filteredData.reduce((acc: any, value: any) => {
        if (!acc.includes(value.collectionName)) {
          acc.push(value.collectionName);
        }
        return acc;
      }, []);

      this.usersGroup = filteredData.reduce((acc: any, value: any) => {
        if (!acc.includes(value.updatedBy)) {
          acc.push(value.updatedBy);
        }
        return acc;
      }, []);


    } catch (error) {
      console.error('error: ', error);

    }
  }
  async syncProduct() {
    try {
      this.bbLoader.showLoader();
      const product = await firstValueFrom(this.masterService.syncAllProductsQuickbook());
      if (product?.message) {
        this.bbToaster.show_success(product.message);
      } else {
        this.bbToaster.show_error(product?.error);
      }
    } catch (error) {
      console.error('error: ', error);

    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async syncCustomer() {
    try {
      this.bbLoader.showLoader();
      const customer = await firstValueFrom(this.customerService.SyncAllCustomerQuickbook());
      if (customer?.message) {
        this.bbToaster.show_success(customer.message);
      } else {
        this.bbToaster.show_error(customer?.error);
      }
    } catch (error) {
      console.error('error: ', error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async syncIndustry() {
    try {
      // this.bbLoader.showLoader();
      // const category: any = await firstValueFrom(this.masterService.SyncAllCategoryQuickbook());
      // if (category?.message) {
      //   this.bbToaster.show_success(category.message);
      // } else {
      //   this.bbToaster.show_error(category?.error);
      // }
    } catch (error) {
      console.error('error: ', error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  onEditComplete(event: any) {
    console.log('Edit Complete:', event);

    console.log('Updated Field:', event.field);

  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.message = '';
  }

  async uploadFile() {
    if (!this.typeOfUpload) {
      alert("Please select upload type!");
      return;
    }

    if (!this.selectedFile) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append("file", this.selectedFile);
    formData.append("type", this.typeOfUpload);

    try {
      const result = await this.OpportunitiesService.uploadProductViaExcel(formData);
      this.message = result.message || "Upload successful";
      console.log("Upload success:", result);
    } catch (error: any) {
      console.error("Upload failed:", error);
      this.message = "Upload failed: " + error.message;
    } finally {
      this.isUploading = false;
    }
  }

  async ChangeCompanyStatus() {
    try {
      this.isUploadingc = true;
      const result = await this.OpportunitiesService.ChangeCompanyStatus();
      this.changestatus = result.message || " successful";
      console.log(" success:", result);
    } catch (error: any) {
      console.error(" failed:", error);
      this.message = " failed: " + error.message;
    } finally {
      this.isUploadingc = false;
    }
  }

  onChange(event: any) {
    this.typeOfUpload = event.target.value;
  }

}
