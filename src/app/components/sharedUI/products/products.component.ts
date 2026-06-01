import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, inject } from "@angular/core";
import { CustomerDashboardComponent } from "../../adminPortal/customer-dashboard/customer-dashboard.component";
import {
  BBLoaderService,
  BbStoreService,
  BBToastService,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";
import { MastersService } from "projects/customer-management-ui/shared/masters/masters.service";
import { CommonModule } from "@angular/common";

// import { ManualEsignComponent } from "../manual-esign/manual-esign.component";
import { CustomerService } from "projects/customer-management-ui/shared/customer/customer.service";
// import { SharepointService } from "projects/customer-management-ui/shared/sharepoint/sharepoint.service";

import { firstValueFrom } from "rxjs";
import { SettingsService } from "../../../../../shared/settings.service";
@Component({
  selector: "app-products",
  imports: [CommonModule],
  templateUrl: "./products.component.html",
  styleUrl: "./products.component.scss",
})
export class ProductsComponent implements OnInit {
  private customerComponent = inject(CustomerDashboardComponent);
  private bbLoader = inject(BBLoaderService);
  private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private oCategories = inject(CategoriesService);
  private categoryService = inject(CategoriesService);
  private ocustomerService = inject(CustomerService);
  // private sharePoint = inject(SharepointService);
  private masterService = inject(MastersService);
  private settingsService = inject(SettingsService);
  private BbStoreService = inject(BbStoreService);
  private cdRef = inject(ChangeDetectorRef);
  private customerDashboardComponent = inject(CustomerDashboardComponent);

  products: any[] = [];
  categories: any[] = [];
  @Output() productsSaved = new EventEmitter<void>();
  @Output() productlisttoaddcustomer = new EventEmitter<any>();
  @Output() onProductBillingListEmitted = new EventEmitter<any>();
  @Output() productToBillingCycle = new EventEmitter<any>();
  @Input() existingProducts: any[] = [];
  @Input() customerData: any;
  @Output() saveProductsRequest = new EventEmitter<any>();
  @Output() productlisttomanagecustomer = new EventEmitter<any>();
  @Output() onbilling = new EventEmitter<any>();
  @Input() parentName: any;
  @Input() productData: any;
  productList: any[] = [];
  selectedCategory: string = "All";
  filteredProducts: any[] = [];
  @Input()
  companyid!: string | null;
  showNextBackSkipBtn: boolean = true;
  showSaveBtn: boolean = false;
  isFTE: boolean = false;
  isSubscription: boolean = false;
  subscribedproducts: any[] = [];
  compID!: string;
  countries: any;
  showFteContract: boolean = false;
  showSubscriptionContract: boolean = false;
  fteproductid: any;
  subscriptionproductid: any;
  category_name: any;
  categoryId: any;
  opportunity: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {}

  productsPgNextFn() {
    // this.customerComponent.ShowManualEsign = true;
    this.customerComponent.showProductsPg = false;
    const productData = this.productList;
    this.productlisttoaddcustomer.emit(productData);
    this.productToBillingCycle.emit(true);
    this.onProductBillingListEmitted.emit(this.productList);
    // this.customerComponent.stepperProductsSecondFn();
    // this.customerComponent.stepperProductsLastFn();
  }
  @Output() prodSkipEnabled = new EventEmitter<any>();
  productsPgSkipFn() {
    this.customerComponent.ShowManualEsign = true;
    this.customerComponent.showProductsPg = false;
    // this.customerComponent.stepperProductsSecondFn();
    // this.customerComponent.stepperProductsLastFn();
    // this.customerComponent.stepperCompleteDoc();
    //
    this.prodSkipEnabled.emit(true);
  }
  productsSaveFn() {
    // const productData = this.productList;
    if (this.productList.length > 0) {
      this.onbilling.emit(true);
      this.customerComponent.showProductsPg = false;
      // this.ocustomerService.setFormData("billingManageAccount");
      // const response = { companyId: this.companyid };
      this.productlisttoaddcustomer.emit(this.productList);
      this.productToBillingCycle.emit(this.productList);

      let prodBillList: any[] = [];
      // Extracting subscribed products
      // const subscribedProducts = this.subscribedproducts.flatMap(p => p || []);

      // Collect additional charges and ids
      // subscribedProducts.forEach(subscribedProduct => {
      //   const chargeDetails = subscribedProduct.additionalChargesList? subscribedProduct.additionalChargesList:subscribedProduct.chargesList || []; // Assuming this contains the charge details

      //   // Create arrays for additional charges and their IDs
      //   const additionalCharges = chargeDetails.map((charge: { cadditionalCharges: any; }) => charge.cadditionalCharges);
      //   const additionalChargesid = chargeDetails.map((charge: { _id: any; }) => charge._id);
      //   const cAmount = chargeDetails.map((charge: { cAmount: string; }) => charge.cAmount);
      //   const combinedCharges = {
      //     additionalCharges: additionalCharges,
      //     additionalChargesid: additionalChargesid,
      //     cAmount:cAmount
      // };
      // const combinedChargesArray = Object.values(combinedCharges);
      //   prodBillList.push({
      //     _id: subscribedProduct.oProductCategory_Product_Mapping_Id,
      //     price: subscribedProduct.cSoldPrice,
      //     cBasePrice:"450",
      //     cDisplayName: subscribedProduct.cDisplayName,
      //     iBillingFrequency: subscribedProduct.iBillingFrequency,
      //     bIsproductBased: subscribedProduct.bIsproductBased,
      //     cCategory_Name: this.products[0]?.cCategory_Name,
      //     cCategory_Id: this.products[0]?.cCategory_Id,
      //     additionalCharges:[combinedCharges],

      //   });
      // });

      // prodBillList.push({
      //   _id: subscribedProduct.oProductCategory_Product_Mapping_Id,
      //   price: subscribedProduct.cSoldPrice,
      //   cDisplayName: subscribedProduct.cDisplayName,
      //   iBillingFrequency: subscribedProduct.iBillingFrequency,
      //   bIsproductBased: subscribedProduct.bIsproductBased,
      //   cCategory_Name: this.products[0]?.cCategory_Name,
      //   cCategory_Id: this.products[0]?.cCategory_Id,
      //   additionalCharges, // Set the collected additional charges
      //   additionalChargesId // Set the collected additional charge IDs
      // });

      // Extracting additional products from productList
      const prodlist = this.productList.flatMap((p) => p || []); // Adjusted to flatten correctly

      prodlist.forEach((prodlisted) => {
        prodBillList.push({
          _id: prodlisted._id,
          [prodlisted?.Subscription ? "Subscription" : "FTE"]: prodlisted?.FTE || prodlisted?.Subscription,
          price: prodlisted.price,
          cBasePrice: prodlisted.cBasePrice,
          cDisplayName: prodlisted.cDisplayName,
          cCategory_Name: prodlisted.cCategory_Name,
          cCategory_Id: prodlisted.cCategory_Id,
          additionalCharges: Array.isArray(prodlisted.additionalCharges)
            ? prodlisted.additionalCharges
            : [prodlisted.additionalCharges],
        });
      });

      // Setting the combined product billing list in the service
      this.oCategories.setManageProductList(prodBillList);

      // this.saveProducts(response);
    } else {
      this.bbToaster.show_warn("Please select the Products");
    }
  }

  userId!: string;

  async ngOnInit(): Promise<void> {
    this.compID = this.BbStoreService.getItem("selectedCompanyId");
    this.userId = this.bbStore.getItem("userId") || this.bbStore.getItem("userid");

    await this.loadCategories();
    await this.loadProducts();
    await this.loadCountries();
    await this.settingsService.loadDecimalDigit();
    if (this.parentName == "new") {
      this.showNextBackSkipBtn = true;
      this.showSaveBtn = false;
      this.productList = await firstValueFrom(this.oCategories.productList$);
    } else {
      this.subscribedproducts = [...this.existingProducts];
      this.showNextBackSkipBtn = false;
      this.showSaveBtn = true;
      // this.productList=this.existingProducts;
    }
    await this.loadopportunities();
    this.cdRef.detectChanges();
  }

  async saveProducts(_response: any) {
    const products = this.productList;
    if (products && products.length > 0) {
      const requestData = {
        products,
        cCreatedBy: this.userId,
      };
      const productresponse = await this.ocustomerService.addproductstoCompany(
        this.companyid ? this.companyid : "",
        requestData
      );
      if (productresponse) {
        this.bbToaster.show_success(productresponse.message);
        this.productsSaved.emit();
      } else {
        this.bbToaster.show_error(productresponse.message);
      }
    }
  }
  // handleExistingProducts() {

  //   this.existingProducts.forEach(product => {
  //     const productCategoryMappingId = product.oProductCategory_Product_Mapping_Id;
  //     if (this.isProductInList(productCategoryMappingId)) {
  //     } else {
  //     }
  //   });
  // }

  async loadCountries(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      const country: any = await firstValueFrom(this.masterService.GetCountries());
      this.countries = country.find((item: any) => item._id === this.customerData.country);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async loadopportunities() {
    try {
      let lastIndustryId: string | undefined;

      if (this.parentName === "new") {
        if (this.customerData.opportunities?.length === 1) {
          lastIndustryId = this.customerData.opportunities[0]?.oOpportunityIndustryId;
        }
      } else {
        const response = await firstValueFrom(
          this.ocustomerService.getloadopportunitiesCompany(this.companyid, "client")
        );
        this.opportunity = response;

        if (this.opportunity.data?.length === 1) {
          lastIndustryId = this.opportunity.data[0]?.oOpportunityIndustryId;
        }
      }
      if (lastIndustryId) {
        const matchedCategory = this.categories.find((cat) => cat._id === lastIndustryId);
        this.selectedCategory = matchedCategory?.cCategory_Name || "All";
      } else {
        this.selectedCategory = "All";
      }
      if (this.selectedCategory && this.selectedCategory !== "All") {
        this.onCategoryClick(this.selectedCategory);
      } else {
        this.onAllClick();
      }

      this.cdRef.detectChanges();
    } catch (error) {
      console.error("error:", error);
    }
  }

  //     async loadopportunities() {

  //     try {
  //       this.opportunity = await firstValueFrom(this.ocustomerService.getloadopportunitiesCompany(this.companyid, "client"));
  //       console.log('opportunity: ', this.opportunity);
  // const lastIndustryId = this.opportunity?.data?.[this.opportunity.data.length - 1]?.oOpportunityIndustryId;

  //   console.log('this.categories: ', this.categories);

  // if (lastIndustryId) {
  //   const matchedCategory = this.categories.find(
  //     (cat) => cat._id === lastIndustryId
  //   );
  //   this.selectedCategory = matchedCategory?.cCategory_Name;
  //   console.log(" this.selectedCategory ", this.selectedCategory );
  //    if (this.selectedCategory) {
  //         this.onCategoryClick(this.selectedCategory);
  //       }

  //       else{this.selectedCategory = 'All';
  //    this.onAllClick();
  //    this.cdRef.detectChanges();}

  // } else {
  //   this.selectedCategory = 'All';
  //    this.onAllClick();
  //    this.cdRef.detectChanges();
  // }

  //     } catch (error) {
  //       console.log('error: ', error);

  //     }
  //   }

  async loadCategories(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      const IndustrtyData = await firstValueFrom(this.masterService.getAllCategories());
      this.categories = IndustrtyData.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async loadProducts(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      let response;
      if (this.parentName == "new") {
        response = await this.oCategories.getProductsGrpCountry(this.customerData?.country);
      } else {
        let responses = await this.oCategories.getCompanyDeatilsByID(this.companyid);
        const country = responses.data;
        response = await this.oCategories.getProductsGrpCountry(country.cCountry);
      }

      this.products = response.data;
      this.products.forEach((category: any) => {
        category.ProductList.forEach((pro: any) => {
          const base = pro.cBasePrice?.[0]?.basePrice;
          if (base !== null && base !== undefined) {
            pro.formattedBasePrice = this.settingsService.getFormattedAmount(Number(base));
          } else {
            pro.formattedBasePrice = null;
          }
        });
      });

      console.log("this.products77: ", this.products);
      this.filteredProducts = [...this.products];

      // Filter categories based on products' category IDs
      this.categories = this.categories.filter((item) =>
        this.filteredProducts.some((prd) => prd.cCategory_Id === item._id)
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  receiveFteValues(fteValues: any[]) {
    if (fteValues.length > 0) {
      const productDetails = this.products
        .flatMap((p) => p.ProductList)
        .find((p: any) => p.product_ID === this.fteproductid);

      if (productDetails) {
        this.productList.push({
          _id: this.fteproductid,
          FTE: true,
          price: "",
          cDisplayName: productDetails.cDisplayName,
          cBasePrice: "",
          cCurrencySymbol: "",
          cCategory_Name: this.products[0]?.cCategory_Name,
          cCategory_Id: this.products[0]?.cCategory_Id,
          additionalCharges: [],
        });
      }
      this.cdRef.detectChanges();
    }
  }
  async addProdutsToList(_event: any, productID: any, index: any, isFTE: any, categoryId: any, bIsSubscription: any) {
    const category = this.categories.find((item) => item._id === categoryId);
    try {
      this.bbLoader.showLoader();
      if (isFTE) {
        this.isFTE = isFTE;
        this.fteproductid = productID;
        this.fteContractModalfn();
        this.categoryId = categoryId;
        this.category_name = category.cCategory_Name;

        // if(this.FteContractComponent.fteValues.length>0){
        //       const productDetails = this.products.flatMap(p => p.ProductList).find((p: any) => p.product_ID === productID);

        // if (productDetails) {

        //   this.productList.push({
        //     _id: productID,
        //     FTE:true,
        //     price: "",
        //     cDisplayName: productDetails.cDisplayName,
        //     cBasePrice: "",
        //     cCurrencySymbol: "",
        //     cCategory_Name: this.products[0]?.cCategory_Name,
        //     cCategory_Id: this.products[0]?.cCategory_Id ,
        //     additionalCharges:
        //                       []});

        //   }}
        //   if (this.parentName !== "new") {
        //     this.existingProducts.push({
        //       oProductCategory_Product_Mapping_Id: productID,
        //       FTE:true,
        //     });f
        //   }

        this.cdRef.detectChanges();
      } else if (bIsSubscription) {
        this.isSubscription = bIsSubscription;
        this.subscriptionproductid = productID;
        this.subscriptionContractModalfn();
        this.categoryId = categoryId;
        this.category_name = category.cCategory_Name;
        this.cdRef.detectChanges();
      } else {
        let cBasePrice = document.getElementById(`${productID + "_" + index}`) as HTMLSelectElement;

        if (cBasePrice.value == "" || cBasePrice.value == undefined) {
          this.bbToaster.show_error("Please Enter Negotiated Price");
          return;
        }

        if (this.productList.find((f: any) => f._id === productID)) {
          this.bbToaster.show_warn("Selected product already in list.");
          return;
        }
        const productDetails = this.products.flatMap((p) => p.ProductList).find((p: any) => p.product_ID === productID);

        if (productDetails) {
          const basePriceDetail = productDetails.cBasePrice[0];

          this.productList.push({
            _id: productID,
            price: cBasePrice.value,
            FTE: false,
            cDisplayName: productDetails.cDisplayName,
            cBasePrice: basePriceDetail.basePrice,
            cCurrencySymbol: basePriceDetail.CountryCurrencyDetails.cCurrencySymbol,
            cCategory_Name: category?.cCategory_Name,
            cCategory_Id: category?._id,
            additionalCharges: Array.isArray(productDetails.additionalCharges)
              ? productDetails.additionalCharges
              : [productDetails.additionalCharges],
          });
        }
        if (this.parentName !== "new") {
          this.existingProducts.push({
            oProductCategory_Product_Mapping_Id: productID,
            FTE: false,
          });
        }
        this.cdRef.detectChanges();
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  async removeProdutsFromList(_event: any, productID: any, _index: any, _isFTE: any) {
    try {
      this.bbLoader.showLoader();
      // let cBasePrice = document.getElementById(`${productID + "_" + index}`) as HTMLSelectElement;
      if (this.productList.find((f: any) => f._id === productID)) {
        const index = this.productList.findIndex((f: any) => f._id === productID);

        if (index !== -1) {
          this.productList.splice(index, 1);
        }

        if (this.parentName !== "new") {
          const existingIndex = this.existingProducts.findIndex(
            (f) => f.oProductCategory_Product_Mapping_Id === productID
          );
          if (existingIndex !== -1) {
            this.existingProducts.splice(existingIndex, 1);
          }
        }
        const currentFteValues = this.categoryService.getFteValues();
        const currentSubscriptionValues = this.categoryService.getSubscriptionValues();

        const updatedFteValues = currentFteValues.filter((item: any) => item.fteproductid !== productID);

        const updatedSubscriptionValues = currentSubscriptionValues.filter(
          (item: any) => item.subscriptionProductid !== productID
        );

        this.categoryService.clearFteValues();
        this.categoryService.setFteValues(updatedFteValues);
        this.categoryService.clearSubscriptionValues();
        this.categoryService.setSubscriptionValues(updatedSubscriptionValues);
      }
      this.cdRef.detectChanges();
    } catch (err) {
      console.error(err);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  // isProductInList(productID: any): boolean {
  //   if (this.parentName == "new") {

  //   return this.productList.some((f: any) => f._id === productID);}
  //   else{

  //     this.existingProducts.forEach(product => {
  //       const productCategoryMappingId = product.oProductCategory_Product_Mapping_Id;
  //     return this.productList.some((f: any) => f._id === productID);
  //   });
  //   }
  // }

  isProductInList(productID: any): boolean {
    if (this.parentName === "new") {
      return this.productList.some((product: any) => product._id === productID);
    } else {
      // const firstProduct = this.existingProducts[0];
      // this.companyid = firstProduct.oCompany_Id

      return this.existingProducts.some((product: any) => product.oProductCategory_Product_Mapping_Id === productID);
    }
  }
  ProductPrice(productID: any): any {
    if (this.parentName === "new") {
      const product = this.productList.find((product: any) => product._id === productID);
      if (product) {
        return product.price;
      }
      return "";
    } else {
      const product = this.productList.find((product: any) => product._id === productID);
      if (product) {
        return product?.price;
      }
      return "";
    }
  }
  onCategoryClick(categoryName: string) {
    this.selectedCategory = categoryName;
    this.filteredProducts = this.products.filter((product) => product.cCategory_Name === categoryName);
    this.cdRef.detectChanges();
    this.products.forEach((category) => {
      category.ProductList.forEach((product: { product_ID: any }, prodIndex: any) => {
        const inputElement = document.getElementById(`${product.product_ID}_${prodIndex}`) as HTMLInputElement;
        const productExistsInList = this.productList.some((item) => item._id === product.product_ID);
        if (inputElement && !productExistsInList) {
          inputElement.value = "";
        }
      });
    });
    this.cdRef.detectChanges();
  }

  onAllClick() {
    this.selectedCategory = "All";
    this.filteredProducts = this.products;
    this.cdRef.detectChanges();
    this.products.forEach((category, _catIndex) => {
      category.ProductList.forEach((product: { product_ID: any }, prodIndex: any) => {
        const inputElement = document.getElementById(`${product.product_ID}_${prodIndex}`) as HTMLInputElement;
        const productExistsInList = this.productList.some((item) => item._id === product.product_ID);
        if (inputElement && !productExistsInList) {
          inputElement.value = "";
        }
      });
    });
    this.cdRef.detectChanges();
    // this.ngOnInit();
  }

  backToCustomerAddCustomer() {
    this.customerDashboardComponent.showAddCustomer = true;
    this.customerDashboardComponent.showProductsPg = false;
    // this.customerDashboardComponent.removetoggleStepper();
    const productData = this.productList;
    this.productlisttoaddcustomer.emit(productData);
    this.oCategories.setProductList(this.productList);
    // this.customerDashboardComponent.resetStepperLast();
    // this.customerDashboardComponent.resetStepperSecond();
    // this.customerDashboardComponent.resetStepperFirst();
    // this.customerDashboardComponent.stepperProductsSecondFn();
    // this.customerDashboardComponent.stepperProductsLastFn();
  }
  checkProductAlreadyInList(productID: any) {
    if (this.subscribedproducts?.some((product: any) => product?.oProductCategory_Product_Mapping_Id === productID)) {
      return true;
    } else {
      return false;
    }
  }
  onValueInput(productID: any, index: any, isValidBaseProice: boolean): void {
    const input = document.getElementById(`${productID + "_" + index}`) as HTMLSelectElement;
    if (!input) return;
    if (isValidBaseProice) {
      let value = input.value.replace(/[^0-9.]/g, "");

      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }
      // if (parts.length === 2) {
      //   value = parts[0] + "." + parts[1];
      // }
      const formatted = this.settingsService.getFormattedAmount(Number(value));

      input.value = formatted;
    } else {
      this.bbToaster.show_warn(
        "This product is not mapped to the selected country. Please add the current product and set the base price against the selected country."
      );
      input.value = "";
    }
  }
  fteContractModalfn() {
    this.showFteContract = true;
  }
  subscriptionContractModalfn() {
    this.showSubscriptionContract = true;
  }
  onCloseFteModlFn(event: any) {
    this.showFteContract = event;
  }
  onCloseSubscriptionModl(event: any) {
    this.showSubscriptionContract = event;
  }
}
