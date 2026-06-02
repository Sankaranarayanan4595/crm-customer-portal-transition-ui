import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
// import { AgGridDataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component';
import { TransitionService } from 'projects/crm-customer-portal-transition-ui/shared/transition/transition.service';
import { firstValueFrom } from 'rxjs';
import { TransitionModalComponent } from './transition-modal/transition-modal.component';
import { Router } from '@angular/router';
import { Dialog } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { BBLoaderService, BbStoreService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { CategoriesService } from 'projects/customer-management-ui/shared/categories/categories.service';
import { initializeControls } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/controls/control';

@Component({
  selector: 'app-initiate-transition',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    NgMultiSelectDropDownModule,
    NgbModule,
    IconFieldModule,
    ButtonModule,
    CommonModule,
    InputIconModule,
    InputTextModule, TooltipModule, Dialog, FloatLabelModule, SelectModule
  ],
  templateUrl: './initiate-transition.component.html',
  styleUrl: './initiate-transition.component.scss'
})
export class InitiateTransitionComponent {
  private transitionService = inject(TransitionService);
  private modalService = inject(NgbModal);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bbLoader = inject(BBLoaderService);
  private categoryService = inject(CategoriesService);
  private bbToaster = inject(BBToastService);
  private bbStore = inject(BbStoreService);

  [x: string]: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {

  }
  filterForm!: FormGroup;
  rawData: any;
  users: any = [];
  opportunityList: any = [{ cOpportunityName: "All", _id: "0" }];
  usersList: any = [{ loginName: "All", _id: "0" }];
  accountList: any = [{ accountName: "All", _id: "0" }];
  statusList: any = [{ statusName: "All", _id: "0" }];
  listItems: any = [];
  listItemsColumnData: any;
  showTransitionModal: boolean = false;
  TransitionSuccessMdl: boolean = false;
  datafetching: any;
  table: any;
  themeClass: any;
  page = 1;
  pageSize = 50;
  totalRecords = 0; // Update this dynamically from your data count
  transitionDetails: any = null;
  showFilter: any = false;
  searchText: any;
  async ngOnInit() {
    this.applyAllControlPermissions();
    this.filterForm = this.fb.group({
      opportunity: ["0"],
      users: ["0"],
      status: ["0"],
      account: ["0"],
    });
    try {
      this.bbLoader.showLoader();
      await Promise.all([
        await this.loadUsers(),
        await this.loadOpportunityForTransition()
      ])
    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async applyAllControlPermissions() {
    // console.log("Applying permissions...");

    const savedControls = this.bbStore.getItem("mastercontrols");
    console.log("savecontrol=>", savedControls);

    const item = this.bbStore.getItem("controls");
    console.log("item=>", item);
    if (savedControls && item) {
      const controls = JSON.parse(savedControls);
      const actionData = JSON.parse(item);

      setTimeout(() => {
        initializeControls(controls, actionData, "id", new FormGroup({}));
        initializeControls(controls, actionData, "class", new FormGroup({}));
      });
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.users = await this.categoryService.getUsers();
      // Sort alphabetically by name
      this.users.sort((a: { loginName: string }, b: { loginName: string }) =>
        a.loginName.localeCompare(b.loginName)
      );

    } catch { }
  }

  async loadOpportunityForTransition() {
    try {
      const transition: any = await firstValueFrom(this.transitionService.loadOpportunityForTransition());
      console.log('transition: ', transition);
      this.rawData = transition?.data?.filter(
        (item: any) =>
          !Array.isArray(item.productDetails) || // Keep if productDetails is missing or not an array
          !item.productDetails.every((val: any) => val.isTransition === true) // Keep if not all are true
      );

      this.table = this.rawData;
      this.totalRecords = this.rawData?.length;
      this.listItems = this.rawData?.slice(0, this.pageSize);
      const uniqueOpportunities = new Set();
      const uniqueStatuses = new Set();
      const uniqueAccounts = new Set();
      const uniqueUsers = new Set();
      this.opportunityList = [{ cOpportunityName: "All", _id: "0" }];
      this.usersList = [{ loginName: "All", _id: "0" }];
      this.accountList = [{ accountName: "All", _id: "0" }];
      this.statusList = [{ statusName: "All", _id: "0" }];
      this.listItems?.forEach((val: any, _index: number) => {
        // For Opportunities
        if (val.cOpportunityName && !uniqueOpportunities.has(val.cOpportunityName)) {
          uniqueOpportunities.add(val.cOpportunityName);
          this.opportunityList.push({
            cOpportunityName: val.cOpportunityName,
            _id: val._id
          });
        }

        // For Statuses
        if (val.opportunityStatus && !uniqueStatuses.has(val.opportunityStatus)) {
          uniqueStatuses.add(val.opportunityStatus);
          this.statusList.push({
            statusName: val.opportunityStatus,
            _id: val.opportunityStatusId
          });
        }

        // For Accounts
        if (val.AccountName && !uniqueAccounts.has(val.AccountName)) {
          uniqueAccounts.add(val.AccountName);
          this.accountList.push({
            accountName: val.AccountName,
            _id: val.AccountId
          });
        }

        // For Users
        if (val.accountOwnerId && !uniqueUsers.has(val.accountOwnerId)) {
          uniqueUsers.add(val.accountOwnerId);
          const findUser = this.users?.find((user: any) => user._id === val.accountOwnerId)
          this.usersList.push({
            loginName: findUser.loginName,
            _id: val.accountOwnerId
          });
        }
      });

    } catch (error) {
      console.log('error: ', error);

    }
  }
  async onAllSearch(event: any) {
    this.searchText = event;
    if (event?.target.value !== "") {
      this.listItems = this.table.filter((e: any) => {
        return Object.values(e).some((value) =>
          String(value)
            .toLowerCase()
            .includes(event.target.value ? event.target.value.toLowerCase() : "")
        );
      });
      this.page = 1;
      this.totalRecords = this.listItems?.length;
    } else {
      await this.applyFilter();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  // Call this whenever you need to refresh the visible list (on page or pageSize change)
  updateListItems() {
    const start = (this.page - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.listItems = this.rawData.slice(start, end);
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.page = 1; // Reset to first page when page size changes
    this.updateListItems();
  }

  goToFirst() {
    if (this.page > 1) {
      this.page = 1;
      this.updateListItems();
    }
  }

  goToPrev() {
    if (this.page > 1) {
      this.page--;
      this.updateListItems();
    }
  }

  goToNext() {
    if (this.page < this.totalPages) {
      this.page++;
      this.updateListItems();
    }
  }

  goToLast() {
    if (this.page < this.totalPages) {
      this.page = this.totalPages;
      this.updateListItems();
    }
  }

  total() {
    return Math.min(this.page * this.pageSize, this.totalRecords);
  }

  async onInitiateTransition(opp: any) {
    try {
      this.bbLoader.showLoader();
      console.log('opp: ', opp);

      const checkEligible = await firstValueFrom(this.transitionService.checkAccountTransitionInitiated(opp?.AccountId));

      if (checkEligible?.isTransitionInitiated) {
        return this.bbToaster.show_warn("Transition approvers are not configured for the account. Please set approvers to proceed with Initiate Transition process")
      }
      this.showTransitionModal = true;

      const selectedProducts = opp.productDetails?.filter((val: any) => !val.isTransition);

      const modalRef = this.modalService.open(TransitionModalComponent, {
        size: "xl",
        animation: false,
        windowClass: "modal-xl",
      });
      modalRef.componentInstance.selectedProducts = selectedProducts?.map((item: any) => {
        return {
          ...item,
          _id: item._id || item.productId, // Ensure _id is present for checkbox selection
          productId: item.productId,
          cDisplayName: `${item?.cDisplayName} | ${item?.cFeaturesDesc} | ${item?.oProduct_Level?.cLevels || ""}`
        }
      });
      modalRef.componentInstance.showTransitionModal = true;
      modalRef.componentInstance.accountId = opp?.AccountId;
      modalRef.componentInstance.opportunityId = opp._id;
      modalRef.componentInstance.saveTransition = true;
      modalRef.componentInstance.closeModalEvent.subscribe(async (data: any) => {
        if (data?.isUpdated) {
          const productIds = data?.selectedProducts || [];
          this.transitionDetails = {
            ...opp,
            ...data,
            productName:
              selectedProducts
                ?.filter((prod: any) => productIds.includes(prod.productId))
                .map((prod: any) => prod.cFeaturesDesc)
                .join(", ") || "",
          };
          if (data.isUpdated) {
            this.TransitionSuccessMdl = true;
            await this.ngOnInit();
            this.updateListItems();
            this.onAllSearch(this.searchText);
          }
        }
        else {
          this.showTransitionModal = false;
        }
      });
    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  isTransition(opp: any) {
    return opp?.productDetails?.every((val: any) => val.isTransition === true);
  }

  TransitionSuccessMdlFn(val: boolean) {
    if (val) {
      this.TransitionSuccessMdl = true;
    } else {
      this.TransitionSuccessMdl = false;
    }
  }
  toTranstion() {
    this.router.navigate(['transition/dashboard']);
    this.closemdl();
  }
  closemdl() {
    this.TransitionSuccessMdl = false;
    this.showTransitionModal = false;
    this.onAllSearch(this.searchText);
  }

  getProductNames(opp: any): string[] {
    if (!opp.productDetails || !opp.productDetails.length) return [];

    // Count how many times each cDisplayName appears
    const nameCounts: Record<string, number> = {};
    opp.productDetails.forEach((prod: any) => {
      nameCounts[prod.cFeaturesDesc] = (nameCounts[prod.cFeaturesDesc] || 0) + 1;
    });

    // Map products to string, adding billing unit if cFeaturesDesc duplicates exist
    return opp.productDetails?.filter((val: any) => !val.isTransition).map((prod: any) => {
      if ((nameCounts[prod.cFeaturesDesc] || 0) > 1) {
        return `${prod.cFeaturesDesc} (${prod.oBilling_Unit?.cBillingUnit || ""})`;
      }
      return prod.cFeaturesDesc;
    }).join(", ");
  }

  filterShow() {
    return (this.showFilter = !this.showFilter);
  }
  async resetFilter() {
    this.filterForm = this.fb.group({
      opportunity: ["0"],
      users: ["0"],
      status: ["0"],
      account: ["0"],
    });
    this.listItems = this.rawData;
    this.page = 1;
    this.totalRecords = this.listItems?.length;
    if (this.searchText?.target?.value !== "") {
      await this.onAllSearch(this.searchText);
    }
    // this.filterShow();
  }
  async applyFilter() {
    const { opportunity, users, status, account } = this.filterForm.value;
    // If all filters are default, reset the table
    if ([opportunity, users, status, account].every(val => val === "0" || val === 0 || val === null || val === "")) {
      this.table = this.rawData;
      this.listItems = this.table;
      // this.filterShow();
      return;
    }

    const filterData = Array.isArray(this.rawData) ? [...this.rawData] : [];

    const filtered = filterData.filter((item: any) => {
      // Use ID comparison directly
      const matchOpportunity = opportunity === "0" || opportunity === 0 || !opportunity
        || item._id == opportunity; // or whatever field holds opportunity ID

      const matchUser = users === "0" || !users
        || item.accountOwnerId == users; // adjust based on your data

      const matchStatus = status === "0" || !status
        || item.opportunityStatusId == status; // adjust based on your data

      const matchAccount = account === "0" || !account
        || item.AccountId == account; // adjust based on your data

      return matchOpportunity && matchUser && matchStatus && matchAccount;
    });
    // this.filterShow();
    this.table = filtered;
    this.listItems = filtered;
    this.page = 1;
    this.totalRecords = this.listItems?.length;
    if (this.searchText?.target?.value !== "") {
      await this.onAllSearch(this.searchText);
    }
  }

}
