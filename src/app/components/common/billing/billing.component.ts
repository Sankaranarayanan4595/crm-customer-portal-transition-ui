import { Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { CustomerDashboardComponent } from "../../adminPortal/customer-dashboard/customer-dashboard.component";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { ChangeDetectorRef } from "@angular/core";
import { BBLoaderService, DataTableComponent, BbStoreService, BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { CustomerService } from "projects/customer-management-ui/shared/customer/customer.service";
import { firstValueFrom } from "rxjs";
import moment from "moment";
import { SettingsService } from '../../../../../shared/settings.service';

@Component({
    selector: "app-billing",
    imports: [ReactiveFormsModule, DataTableComponent, CommonModule, FormsModule],
    templateUrl: "./billing.component.html",
    styleUrls: ["./billing.component.scss"]
})
export class BillingComponent implements OnInit {
  private customerDetails = inject(CustomerDashboardComponent);
  private fb = inject(FormBuilder);
  private bbLoader = inject(BBLoaderService);
  private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private oCategories = inject(CategoriesService);
  private ocustomerService = inject(CustomerService);
  private cdRef = inject(ChangeDetectorRef);
  private settingsService = inject(SettingsService);

  billingForm!: FormGroup;
  saveBilling: boolean = false;
  hidebtnsNextPrev: boolean = true;
  listItems: any;
  rawData: any = [];
  @Input() showSaveInBilling: any;
  @Input() updatedProducts: any;
  @Input()
  companyid!: string | null;
  @Input() parentName: any;
  @Output() onBillingFntrigger: EventEmitter<void> = new EventEmitter<void>();
  @Output() enableProducts = new EventEmitter<boolean>();
  selectedValue: string = 'company';

  companyFrequencies = [
    { value: 1, label: 'Monthly' },
    { value: 2, label: 'Bi-monthly' },
    { value: 4, label: 'Quarterly' },
    { value: 6, label: 'Semi-annual' },
    { value: 12, label: 'Annual' }
  ];

  productFrequencies = this.companyFrequencies;

  AddedProducts: any[] = [];
  @Output() onProductBillingListEmitted = new EventEmitter<any>();
  newUpdatedProducts: any;
  @Output() productsSaved = new EventEmitter<void>();
  table: any;
  productListItems: { [key: string]: any } = {};
  defDateFormat: any;
  defTimeZone: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  onDropdownChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedValue = target.value;
  }
  recive_data(data: any) {
    if (data.type == "delete") {
    } else if (data.type == "edit") {
    } else if (data.type == "viewdocument") {

    } else if (data.type == "userprofile") {
    }

  }

  fontSize: string = "2rem";
  action_fields = {
    // view: false,
    // copy: false,
    // manager_type: false,
    // email: false,
    // restrict_view: false,
    // editprofile: false,
    // adddocument: false,
    delete: false,
    edit: false,
    viewdocument: false,
    userprofile: false,
  };

  position = "last";

  image_colum = {
    show: false,
    header: "Global",
    url: "../../assets/icons/download.png",
  };

  button_colum = {};
  userId!: string;
  async ngOnInit(): Promise<void> {
  this.userId = this.bbStore.getItem("userId") || this.bbStore.getItem("userid");

    this.billingForm = this.fb.group({
      cBillingCycle: [this.selectedValue, [Validators.required]],
      cCompanyFrequency: [1],
      cProductFrequency: [1],
      cBasePrice: ["", [Validators.required, Validators.pattern("^[0-9]*$")]],
    });
    await this.settingsService.loadDecimalDigit();
    if (this.parentName === "old") {
      this.AddedProducts = await firstValueFrom(this.oCategories.manageProductList$);
      const uniqueProductIds = new Set();

      this.AddedProducts.forEach(async product => {
        let productData = [];

        let fteProducts = await firstValueFrom(this.oCategories.fteValues$)
        let subscriptionProducts = await firstValueFrom(this.oCategories.subscriptionValues$);

        if (product.FTE) {
          productData = fteProducts;
        } else if (product.Subscription) {
          productData = subscriptionProducts;
        }
    
        // Filter out duplicates based on product ID
        productData.forEach(item => {
          const productId = item['_id'];
          if (!uniqueProductIds.has(productId)) {
            uniqueProductIds.add(productId);
            this.rawData.push(item); // Only add unique items
          }
        });
        
        console.log('this.rawData: ', this.rawData);
        
        if (product.FTE === true) {

          const matchingFteValues = this.rawData.filter((item: { [x: string]: any }) => {
            return item['fteproductid'] === product._id;
          });

          if (matchingFteValues.length > 0) {        
            const filteredData = matchingFteValues.map((item: { [key: string]: any }) => ({
                "Number of FTEs": this.settingsService.getFormattedAmount(Number(item['cUsertype'].reduce((sum: number, userType: any) => sum + userType['iFTEQty'], 0))),
                "Billing Type": item['oBillingType'],
                "Contract start date": this.convertDateToDDMMYYYY(item['fromDate']),
                "Contract end date": this.convertDateToDDMMYYYY(item['dueDate']),
                "Frequency of bills": item['billingFrequencyText'],
                "First Bill Date": this.convertDateToDDMMYYYY(item['firstBillingDate']),
                "Billing Date": item['billingDateText'],
                "Escalation Clause": item['escenabled'] ? 'Yes' : 'No',
                "Percentage/Amount": this.settingsService.getFormattedAmount(Number(item['escPer'] ? item['escPer'] : item['escAmount'] ? item['escAmount'] : "")),
                "Escalation Frequency": item['escbillingFrequencyText'],
                "Total": this.settingsService.getFormattedAmount(Number(item['total'])),
                _id: { _id: item["fteproductid"] }
            }));
        
            this.table = filteredData;
            if (product && product._id) {
                this.productListItems[product._id] = filteredData;
            }
        }
        
        }else if (product.Subscription === true) {

          const matchingFteValues = this.rawData.filter((item: { [x: string]: any }) => {
            return item['subscriptionProductid'] === product._id;
          });

          if (matchingFteValues.length > 0) {
            const filteredData = matchingFteValues.map((item: { [key: string]: any }) => ({
              "Number of Users": this.settingsService.getFormattedAmount(Number(item['cUsertype'].reduce((sum: number, userType: any) => sum + userType['iNoofUsers'], 0))),
              "Billing Type": item['oBillingType'],
              "Contract start date": this.convertDateToDDMMYYYY(item['fromDate']),
              "Contract end date": this.convertDateToDDMMYYYY(item['dueDate']),
              "Frequency of bills": item['billingFrequencyText'],
              "First Bill Date": this.convertDateToDDMMYYYY(item['firstBillingDate']),
              "Billing Date": item['billingDateText'],
              "Escalation Clause": item['escenabled'] ? 'Yes' : 'No',
              "Percentage/Amount": this.settingsService.getFormattedAmount(Number(item['escPer'] ? item['escPer'] : item['escAmount'] ? item['escAmount'] : "")),
              "Escalation Frequency": item['escbillingFrequencyText'],
              "Total": this.settingsService.getFormattedAmount(Number(item['total'])),



              _id: { _id: item["fteproductid"], }
            }));
            this.table = filteredData;
            if (product && product._id) {
              this.productListItems[product._id] = filteredData;
            }
          }
        }

        const frequencyControlName = `cProductFrequency_${product._id}`;
        this.billingForm.addControl(frequencyControlName, this.fb.control(1));

        if (product.additionalCharges && product.additionalCharges.length > 0) {
          if (!product.additionalCharges[0].charge) {
            product.additionalCharges = product.additionalCharges[0].additionalCharges.map(
              (charge: any, index: number) => {
                const controlName = `${charge}_${product._id}`;
                const value = charge?.value || "";
        
                // Dynamically add control to form
                this.billingForm.addControl(controlName, this.fb.control(value));
        
                return {
                  charge: charge,
                  id: product.additionalCharges[0].additionalChargesid[index],
                  value: value
                };
              }
            );
          }
        } else {
          product.additionalCharges = [];
        }
        
      });
      console.log('this.AddedProducts: ', this.AddedProducts);

      this.checkProductBased();
    }

    if (this.showSaveInBilling) {
      this.hidebtnsNextPrev = false;
    }

    if (this.updatedProducts?.length > 0) {
      await this.loadProducts();
      this.selectedValue = this.updatedProducts[0]?.isProductBilling ? 'product' : 'company';
      this.initializeFormWithUpdatedProducts();
    } else {
      await this.loadProducts();
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

  // Initialize the form when updatedProducts is available
  initializeFormWithUpdatedProducts(): void {
    this.AddedProducts.forEach((product) => {
      // Set billing frequency based on product or company level
      const frequencyControlName = `cProductFrequency_${product._id}`;
      this.billingForm.addControl(frequencyControlName, this.fb.control(product.billingFrequency || 1));
      
      // Loop through additional charges and add each as a control
      product.additionalCharges?.forEach((charge: { charge: any; value: any; }) => {
        const controlName = `${charge.charge}_${product._id}`;
        this.billingForm.addControl(controlName, this.fb.control(charge.value || ""));
      });
      console.log('this.AddedProducts: ', this.AddedProducts);
    });

    this.checkProductBased();
  }

  // Check if any product is product-based and update the form accordingly
  checkProductBased(): void {
    const hasProductBased = this.AddedProducts.some(product => product.isProductBilling);
    this.selectedValue = hasProductBased ? 'product' : 'company';

    this.billingForm.patchValue({
      cBillingCycle: this.selectedValue
    });

    this.cdRef.detectChanges();
  }

  async loadProducts(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      this.AddedProducts = await firstValueFrom(this.oCategories.productList$);
      if (this.updatedProducts && this.updatedProducts.length > 0) {
        this.updatedProducts.forEach((updatedProduct: { _id: any; additionalCharges: any; }) => {
          const index = this.AddedProducts.findIndex(product => product._id === updatedProduct._id);
          if (index !== -1) {
            // Update only the additionalCharges of the matching product
            this.AddedProducts[index] = updatedProduct;

          }
        });
      }
      const uniqueProductIds = new Set();

      this.AddedProducts.forEach(async product => {
        let productData = [];

        let fteProducts = await firstValueFrom(this.oCategories.fteValues$)
        let subscriptionProducts = await firstValueFrom(this.oCategories.subscriptionValues$);

        if (product.FTE) {
          productData = fteProducts;
        } else if (product.Subscription) {
          productData = subscriptionProducts;
        }
    
        // Filter out duplicates based on product ID
        productData.forEach(item => {
          const productId = item['_id'] ;
          if (!uniqueProductIds.has(productId)) {
            uniqueProductIds.add(productId);
            this.rawData.push(item); // Only add unique items
          }
        });
        
        console.log('this.rawData: ', this.rawData);
        if (product.FTE === true) {

          const matchingFteValues = this.rawData.filter((item: { [x: string]: any }) => {
            return item['fteproductid'] === product._id;
          });

          if (matchingFteValues.length > 0) {
            const filteredData = matchingFteValues.map((item: { [key: string]: any }) => ({
              "Number of FTEs": this.settingsService.getFormattedAmount(Number(item['cUsertype'].reduce((sum: number, userType: any) => sum + userType['iFTEQty'], 0))),
              // "Price per FTE": item['price'],
              "Billing Type": item['oBillingType'],
              "Contract start date": this.convertDateToDDMMYYYY(item['fromDate']),
              "Contract end date": this.convertDateToDDMMYYYY(item['dueDate']),
              "Frequency of bills": item['billingFrequencyText'],
              "Billing Date": item['billingDateText'],
              "Escalation Clause": item['escenabled'] ? 'Yes' : 'No',
              "Percentage/Amount": this.settingsService.getFormattedAmount(Number(item['escPer'] ? item['escPer'] : item['escAmount'] ? item['escAmount'] : "")),
              "Escalation Frequency": item['escbillingFrequencyText'],
              "Total": this.settingsService.getFormattedAmount(Number(item['total'])),


              _id: { _id: item["_id"], }
            }));
            this.table = filteredData;
            if (product && product._id) {
              this.productListItems[product._id] = filteredData;
            }
          } 
        } else if (product.Subscription === true) {
         
          const matchingFteValues = this.rawData.filter((item: { [x: string]: any }) => {
            return item['subscriptionProductid'] === product._id;
          });

          if (matchingFteValues.length > 0) {
            const filteredData = matchingFteValues.map((item: { [key: string]: any }) => ({
              "Number of Users": this.settingsService.getFormattedAmount(Number(item['cUsertype'].reduce((sum: number, userType: any) => sum + userType['iNoofUsers'], 0))),
              // "Price per User": item['price'],
              "Billing Type": item['oBillingType'],
              "Contract start date": this.convertDateToDDMMYYYY(item['fromDate']),
              "Contract end date": this.convertDateToDDMMYYYY(item['dueDate']),
              "Frequency of bills": item['billingFrequencyText'],
              "Billing Date": item['billingDateText'],
              "Escalation Clause": item['escenabled'] ? 'Yes' : 'No',
              "Percentage/Amount": this.settingsService.getFormattedAmount(Number(item['escPer'] ? item['escPer'] : item['escAmount'] ? item['escAmount'] : "")),
              "Escalation Frequency": item['escbillingFrequencyText'],
              "Total": this.settingsService.getFormattedAmount(Number(item['total'])),
              _id: { _id: item["_id"], }
            }));
            this.table = filteredData;
            if (product && product._id) {
              this.productListItems[product._id] = filteredData;
            }
          }
        }

        const frequencyControlName = `cProductFrequency_${product._id}`;
        this.billingForm.addControl(frequencyControlName, this.fb.control(1));

        if (product.additionalCharges && product.additionalCharges.length > 0) {
          if (!product.additionalCharges[0].charge) {
            product.additionalCharges = product.additionalCharges[0].additionalCharges.map((charge: string, index: number) => ({
              charge: charge,
              id: product.additionalCharges[0].additionalChargesid[index],
              value: ''
            }));
          }
        } else {
          product.additionalCharges = [];
        }
      });

      this.updateFormForAdditionalCharges();
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }



  updateFormForAdditionalCharges() {
    this.AddedProducts.forEach(product => {
      product.additionalCharges.forEach((chargeData: { charge: string, id: string, value: string }) => {
        const controlName = `${chargeData.charge}_${product._id}`;
        this.billingForm.addControl(controlName, this.fb.control(chargeData.value));
      });
    });
  }

  async getProductBillingData() {
    try {
      const isProductBilling = this.selectedValue === 'product';
      const selectedFrequency = isProductBilling ? this.billingForm.get("cProductFrequency")?.value : this.billingForm.get("cCompanyFrequency")?.value;

      this.newUpdatedProducts = this.AddedProducts.map(product => ({
        ...product,
        billingFrequency: isProductBilling ? this.billingForm.get(`cProductFrequency_${product._id}`)?.value : selectedFrequency,
        isProductBilling,
        additionalCharges: this.getAdditionalCharges(product),
      }));
    } catch (error) {
      console.error("Error getting product billing data:", error);
    }
  }

  private getAdditionalCharges(product: any): Array<{ charge: string, id: string, value: string }> {
    console.log('this.billingForm: ', this.billingForm);
    return product.additionalCharges.map((chargeData: { charge: string, id: string }) => ({
      charge: chargeData.charge,
      id: chargeData.id,
      value: this.billingForm.controls[`${chargeData.charge}_${product._id}`]?.value || ''
    }));
  }

  validateInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value.replace(/,/g, '');
    if (rawValue.startsWith('.')) {
      rawValue = '0' + rawValue;
    }
    const numericValue = parseFloat(rawValue);
    if (!isNaN(numericValue)) {
      input.value = this.settingsService.getFormattedAmount(numericValue);
    } else {
      input.value = '';
    }
    input.dispatchEvent(new Event('input'));
  }

  async saveBillingFn() {
    try {
      await this.getProductBillingData();
      await this.saveProducts();
      this.onBillingFntrigger.emit();
    } catch (error) {
      console.error("Error during billing save process:", error);
    }
  }

  async confirmToBillingFn() {

    // if (this.billingForm.valid) {
    // this.customerDetails.stepperProductsLastFn();
    // this.customerDetails.stepperCompleteDoc();
    this.customerDetails.billingCycleDetails = false;
    this.customerDetails.ShowManualEsign = true;
    this.getProductBillingData();

    this.onProductBillingListEmitted.emit(this.newUpdatedProducts);

    // } else {
    //     // Mark all controls as touched to display validation messages
    //     this.billingForm.markAllAsTouched();
    // }
  }

  async showProdfromBilling() {
    // this.invoiceService.setFormData("billingProductPage");
    this.enableProducts.emit(true);
    // this.customerDetails.resetStepperLast();
  }

  async saveProducts() {
    try {
      console.log('this.newUpdatedProducts: ', this.newUpdatedProducts);
      if (this.newUpdatedProducts && this.newUpdatedProducts.length > 0) {
        this.bbLoader.showLoader();
        const requestData = {
          products: this.newUpdatedProducts,
          cCreatedBy: this.userId,
          fteData: await firstValueFrom(this.oCategories.fteValues$),
          subscriptionData : await firstValueFrom(this.oCategories.subscriptionValues$)
        };
        const productResponse = await this.ocustomerService.addproductstoCompany(this.companyid || "", requestData);

        if (productResponse) {
          this.bbToaster.show_success(productResponse.message);
          this.productsSaved.emit();
          this.oCategories.clearFteValues();
          this.oCategories.clearSubscriptionValues();
        } else {
          this.bbToaster.show_error(productResponse.message);
          this.oCategories.clearFteValues();
          this.oCategories.clearSubscriptionValues();
        }
      }
    } catch (error) {
      console.error("Error saving products:", error);
    }finally{
      this.bbLoader.hideLoader();
    }
  }
}
