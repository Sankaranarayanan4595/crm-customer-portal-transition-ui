import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BBLoaderService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { CategoriesService } from 'projects/customer-management-ui/shared/categories/categories.service';
import { TransitionService } from 'projects/customer-management-ui/shared/transition/transition.service';
import { firstValueFrom } from 'rxjs';
import { AgGridDataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component';
import { PAGE_SIZE_SELECTOR } from '../../../sharedUI/constants/pagination-list.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CheckboxModule } from 'primeng/checkbox';
import { GridOptions } from 'ag-grid-community';

// Define interfaces
interface User {
  _id: string;
  loginName: string;
  [key: string]: any;
}

interface MappedPhase {
  _id: string;
  cGroupName: string;
  [key: string]: any;
}

interface Product {
  _id: any;
  productId: string;
  cDisplayName: string;
  [key: string]: any;
}

interface ListItem {
  'Action Owner': string;
  'User List': string;
  'actionOwnerId': string;
  'userId': string;
}

interface ActionOwner {
  _id: string;
  cActionOwner: string;
  [key: string]: any;
}

@Component({
  selector: 'app-transition-modal',
  imports: [
    Dialog,
    ButtonModule,
    InputTextModule,
    FloatLabelModule,
    CheckboxModule,
    SelectModule,
    ReactiveFormsModule,
    FormsModule,
    AgGridDataTableComponent,
    MultiSelectModule,
    AutoCompleteModule,
    CommonModule,
  ],
  templateUrl: './transition-modal.component.html',
  styleUrl: './transition-modal.component.scss'
})
export class TransitionModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(CategoriesService);
  private transitionService = inject(TransitionService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private modalService = inject(NgbModal);

  public gridOptions: GridOptions = {
    popupParent: document.body,
  };

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  @Input() showTransitionModal = false;
  @Input() isFromChecklist = false;
  @Input() opportunityId = '';
  @Input() selectedProducts: Product[] = [];
  @Input() isEditMode = false;
  @Input() transitionID = null;

  @Output() closeModalEvent = new EventEmitter<any>();
  @Output() closeTransitionMdl = new EventEmitter<boolean>();

  selectedProductIds: string[] = [];
  paginationPageSizeSelector = PAGE_SIZE_SELECTOR;
  themeClass: any;
  @Input() listItems: any[] = [];
  actionOwnerVisible: boolean = false;
  // Modals visibility
  showActionOwnerModal = false;
  showEditActionOwnerModal = false;
  updateMapping: boolean = false;
  // Action owner management
  actionOwnerList: ActionOwner[] = [];
  editingActionOwner: ActionOwner | null = null;
  actionOwnerToDelete: ActionOwner | null = null;
  // Column definition for AG Grid with actions
  listItemsColumnData = [
    {
      headerName: "Action Owner",
      field: "Action Owner",
      sortable: true,
      filter: "checkboxSearchFilter",
    },
    {
      headerName: "User List",
      field: "User List",
      sortable: true,
      filter: "checkboxSearchFilter",
      cellStyle: {
        "white-space": "normal",
        "word-wrap": "break-word",
        "line-height": "1.4",
        "align-items": "center",
        "height": "40px",
        "overflow": "auto",
      }
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (_params: any) => {
        return `
            <span class="action-icons">
              <div class="d-flex align-items-center gap-4 mt-3">
                <i class="bi bi-pencil-square  before:text-[16px] cursor-pointer" title="Edit" data-action="edit"></i>
                <i class="bi bi-trash text-danger  before:text-[16px] cursor-pointer control-delete DeleteButton" title="Delete"  data-action="delete"></i>
              </div>
            </span>
          `;
      },

      onCellClicked: (params: any) => {
        const event = params.event as MouseEvent;
        const target = event.target as HTMLElement;

        const actionEl = target.closest("[data-action]") as HTMLElement;
        if (!actionEl) return;
        const action = actionEl.dataset["action"];

        if (!action) return;
        switch (action) {
          case "edit":
            this.processForm.get('actionowner')?.setValue(params.data.actionOwnerId);
            this.processForm.get('actionowner')?.disable();
            this.processForm.get('listItemsUsers')?.setValue(params.data.userId || []);
            this.isEditMode = true;
            this.updateMapping = true;
            break;
          case "delete":
            const clone = [...this.listItems];
            this.listItems = clone.filter(item => item.actionOwnerId !== params.data.actionOwnerId);
            this.updateFormControlUsers();
            this.processForm.get('actionowner')?.setValue(null);
            this.processForm.get('listItemsUsers')?.setValue([]);
            this.processForm.get('actionowner')?.enable();
            this.isEditMode = false;
            this.updateMapping = false;
            this.bbToaster.show_success("Action owner deleted successfully");
            break;
        }
      },
    }
  ];

  usersList: User[] = [];
  employeeList: User[] = [];
  mapped_transition_phases: MappedPhase[] = [];
  @Input() accountId: any;
  // Forms
  processForm!: FormGroup;
  actionOwnerForm!: FormGroup;
  contactList: any = [];

  async ngOnInit() {
    this.initializeForms();
    await Promise.all([
      this.loadContactsAgainstAccount(),
      this.loadUsers(),
      this.loadMappedPhasesTemplates(),
      this.loadActionOwners(),
    ]);

    // Auto-select if only one product is available
    if (this.selectedProducts?.length === 1 && this.selectedProducts[0]?._id) {
      this.selectedProductIds = [this.selectedProducts[0]._id];
    }
  }

  async loadContactsAgainstAccount() {
    try {
      const res = await firstValueFrom(this.transitionService.loadContactListAgainstAccount(this.accountId));
      this.contactList = res.data || [];
    } catch (error) {
      console.log('error: ', error);

    }
  }

  initializeForms(): void {
    this.processForm = this.fb.group({
      transitionName: [null, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(75),
        Validators.pattern(/^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/)
      ]],
      transition_manager: [null, Validators.required],
      mapped_phases: [null, Validators.required],
      actionowner: [null],
      listItemsUsers: [[]]
    });

    this.actionOwnerForm = this.fb.group({
      cActionOwner: ['', [Validators.required, Validators.minLength(3)]]
    });

  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.processForm.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty);
  }

  async loadActionOwners(): Promise<void> {
    try {
      const response = await firstValueFrom(this.transitionService.getAllActionOwners());
      if (response?.success) {
        this.actionOwnerList = response.data ? response.data.sort((a: any, b: any) =>
          a.cActionOwner.localeCompare(b.cActionOwner)
        ) : [];

        // If editing and we have a value, ensure it's still valid
        if (this.processForm.get('actionowner')?.value) {
          const currentValue = this.processForm.get('actionowner')?.value;
          const exists = this.actionOwnerList.some(owner => owner._id === currentValue);
          if (!exists) {
            this.processForm.get('actionowner')?.setValue(null);
          }
        }
        if (this.listItems?.length === 0) {
          this.listItems = this.actionOwnerList
            ?.slice(0, 5)
            ?.map((val) => {
              return {
                'Action Owner': val.cActionOwner,
                'User List': [],
                'actionOwnerId': val._id,
                'userId': [],
                'users': []
              };
            }) || [];
        }

      }
    } catch (error) {
      console.error('Error loading action owners:', error);
      this.bbToaster.show_warn('Failed to load action owners');
    }
  }

  async loadUsers(): Promise<void> {
    try {
      this.usersList = await this.profileService.getUsers();
      const response = await firstValueFrom(this.transitionService.getEmpUserNames())
      const users: any = response;
      this.employeeList = users.map((user: any) => ({
        ...user,
        displayName: user.empName,
        displayEmail: user.empEmail || user.email || '',
        loginName: `${user.empName} - ${user.empEmail || user.email || ''}`,
      }));

      this.employeeList = this.employeeList.sort((a: any, b: any) =>
        a.empName?.localeCompare(b.empName) || 0
      );
    } catch (error) {
      console.error('Error loading users:', error);
      this.usersList = [];
    }
  }

  async loadMappedPhasesTemplates(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.transitionService.getAllPhasesTemplatesBActiveMasterMapped()
      );
      this.mapped_transition_phases = res?.success ? res.data : [];
    } catch (error) {
      console.error('Error loading mapped phases:', error);
      this.mapped_transition_phases = [];
    }
  }

  toggleProductSelection(productId: string): void {
    if (this.selectedProductIds.includes(productId)) {
      this.selectedProductIds = this.selectedProductIds.filter(id => id !== productId);
    } else {
      this.selectedProductIds.push(productId);
    }
  }

  onChangeProduct(_event: any, _itemId: string) {
    // [(ngModel)] already manages selectedProductIds array.
    // Create a new array reference to trigger Angular change detection.
    this.selectedProductIds = [...this.selectedProductIds];
  }

  async onUserSelection(event: any) {
    const selectedUsers: any[] = event?.value || [];
    const actionOwnerId = this.processForm.get('actionowner')?.value;

    if (!actionOwnerId) {
      this.bbToaster.show_warn('Please select an Action Owner');
      this.processForm.get('listItemsUsers')?.setValue([]);
      return;
    }

    const actionOwner = this.actionOwnerList.find(
      owner => owner._id === actionOwnerId
    );

    if (!actionOwner) {
      this.bbToaster.show_warn('Action Owner not found');
      return;
    }

    const clonelistItems = this.listItems ? [...this.listItems] : [];

    // Filter valid user IDs
    const validUserIds = selectedUsers.filter(id => id !== null && id !== undefined);

    // Resolve user objects (optional)
    const matchedUsers: User[] = [];
    const contactList = this.contactList.map((c: any) => {
      return {
        _id: c._id,
        loginName: c.cEmail || c.email
      }
    })
    if (this.employeeList && validUserIds.length > 0) {
      validUserIds.forEach(userId => {
        const user = this.employeeList.find(u => u._id === userId);
        if (user) {
          matchedUsers.push(user);
        }
      });
    }
    if (contactList?.length > 0 && validUserIds.length > 0) {
      validUserIds.forEach(userId => {
        const user = contactList.find((u: any) => u._id === userId);
        if (user) {
          matchedUsers.push(user);
        }
      });
    }

    // Find existing item
    const existingItemIndex = clonelistItems.findIndex(
      item => item.actionOwnerId === actionOwnerId
    );

    // ✅ Always prepare item (even if no users selected)
    const newItem = {
      'Action Owner': actionOwner.cActionOwner,
      'User List': matchedUsers.length
        ? matchedUsers.map(user => user.loginName).join(', ')
        : '',
      'actionOwnerId': actionOwnerId,
      'userId': matchedUsers.map(user => user._id),
      'users': matchedUsers
    };

    if (existingItemIndex > -1) {
      clonelistItems[existingItemIndex] = newItem;
      this.bbToaster.show_success("Action owner updated successfully");
    } else {
      this.bbToaster.show_success("Action owner added successfully");
      clonelistItems.push(newItem);
    }

    this.listItems = clonelistItems;
    this.updateFormControlUsers();
  }


  // Helper method to update form control
  private updateFormControlUsers(): void {
    const allUserIds: string[] = [];

    if (this.listItems && this.listItems.length > 0) {
      this.listItems.forEach(item => {
        if (item.userId && Array.isArray(item.userId)) {
          allUserIds.push(...item.userId);
        }
      });
    }

    const uniqueUserIds = [...new Set(allUserIds)];
    this.processForm.get('listItemsUsers')?.setValue(uniqueUserIds);
  }

  // Handle row actions from AG Grid
  onRowAction(event: any): void {
    const { action, rowData } = event;

    switch (action) {
      case 'edit':
        this.editActionOwnerRow(rowData);
        break;
      case 'delete':
        this.deleteActionOwnerRow(rowData);
        break;
    }
  }

  editActionOwnerRow(rowData: ListItem): void {
    // Find the action owner in the list
    const actionOwner = this.actionOwnerList.find(owner =>
      owner._id === rowData.actionOwnerId ||
      owner.cActionOwner === rowData['Action Owner']
    );

    if (actionOwner) {
      this.editingActionOwner = { ...actionOwner };
      this.showEditActionOwnerModal = true;
    }
  }

  deleteActionOwnerRow(rowData: ListItem): void {
    const actionOwner = this.actionOwnerList.find(owner =>
      owner._id === rowData.actionOwnerId ||
      owner.cActionOwner === rowData['Action Owner']
    );

    if (actionOwner) {
      this.actionOwnerToDelete = { ...actionOwner };
      this.showEditActionOwnerModal = true;
    }
  }

  async saveActionOwner(): Promise<void> {
    if (this.actionOwnerForm.invalid) {
      this.markFormGroupTouched(this.actionOwnerForm);
      this.bbToaster.show_warn("Please fill required fields")
      return;
    }

    try {
      const payload = {
        cActionOwner: this.actionOwnerForm.get('cActionOwner')?.value
      };

      const res = await firstValueFrom(this.transitionService.createActionOwner(payload));

      if (res?.success) {
        this.bbToaster.show_success('Action Owner created successfully');

        // Load fresh list of action owners
        await this.loadActionOwners();

        // Find and select the newly created action owner
        const newActionOwner = this.actionOwnerList.find(
          owner => owner.cActionOwner === payload.cActionOwner
        );

        if (newActionOwner) {
          this.processForm.get('actionowner')?.setValue(newActionOwner._id);
        }
        this.isEditMode = true;
        this.closeActionOwnerModal();
      } else {
        this.bbToaster.show_warn(res?.message || 'Failed to create Action Owner');
      }
    } catch (error) {
      console.error('Error creating action owner:', error);
      this.bbToaster.show_warn('An error occurred while creating action owner');
    }
  }

  async updateActionOwner(): Promise<void> {
    if (this.actionOwnerForm.invalid) {
      this.markFormGroupTouched(this.actionOwnerForm);
      return;
    }

    try {
      const payload = {
        cActionOwner: this.actionOwnerForm.get('cActionOwner')?.value
      };

      const res = await firstValueFrom(
        this.transitionService.updateActionOwner(this.processForm.get('actionowner')?.value, payload)
      );

      if (res?.success) {
        this.bbToaster.show_success('Action Owner updated successfully');

        // Refresh the action owners list
        await this.loadActionOwners();

        // Update the table if this action owner is in use
        this.listItems = this.listItems.map(item => {
          if (item.actionOwnerId === this.processForm.get('actionowner')?.value) {
            return {
              ...item,
              'Action Owner': this.actionOwnerForm.get('cActionOwner')?.value
            };
          }
          return item;
        });

        this.closeActionOwnerModal();
      } else {
        this.bbToaster.show_warn(res?.message || 'Failed to update Action Owner');
      }
    } catch (error) {
      console.error('Error updating action owner:', error);
      this.bbToaster.show_warn('An error occurred while updating action owner');
    }
  }

  async deleteActionOwner(): Promise<void> {
    if (!this.actionOwnerToDelete) return;

    try {
      const res = await firstValueFrom(
        this.transitionService.deleteActionOwner(this.actionOwnerToDelete._id)
      );

      if (res?.success) {
        this.bbToaster.show_success('Action Owner deleted successfully');

        // Refresh the action owners list
        await this.loadActionOwners();

        // Remove from form if currently selected
        if (this.processForm.get('actionowner')?.value === this.actionOwnerToDelete._id) {
          this.processForm.get('actionowner')?.setValue(null);
        }

        // Remove from table
        this.listItems = this.listItems.filter(
          item => item.actionOwnerId !== this.actionOwnerToDelete?._id
        );

        this.closeEditActionOwnerModal();
      } else {
        this.bbToaster.show_warn(res?.message || 'Failed to delete Action Owner');
      }
    } catch (error) {
      console.error('Error deleting action owner:', error);
      this.bbToaster.show_warn('An error occurred while deleting action owner');
    }
  }

  closeActionOwnerModal(): void {
    this.showActionOwnerModal = false;
    this.actionOwnerForm.reset();
  }

  closeEditActionOwnerModal(): void {
    this.showEditActionOwnerModal = false;
    this.editingActionOwner = null;
    this.actionOwnerToDelete = null;
  }

  async onSaveBeingTransitioning(): Promise<void> {
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched(this.processForm);

    if (!this.processForm.valid) {
      this.bbToaster.show_error('Please fill all required fields');
      return;
    }

    if (this.selectedProductIds.length === 0) {
      this.bbToaster.show_error('Please select at least one product');
      return;
    }
    if (this.listItems.length === 0) {
      this.bbToaster.show_error('At least one Action Owner mapping is required.');
      return;
    }

    const form = this.processForm.value;

    const payload = {
      cTransition_Name: form.transitionName,
      transition_manager: form.transition_manager,
      mappedPhaseTemplate_Id: form.mapped_phases,
      opportunityDetails: this.selectedProducts
        .filter(p => this.selectedProductIds.includes(p._id))
        .map(p => ({
          opportunityId: this.opportunityId,
          productId: p.productId  // use actual productId for the API
        })),
      actionOwner: this.listItems.map((item: any) => ({
        actionOwnerId: item.actionOwnerId,
        users: item.userId
      }))
    };
      console.log('payload: ', payload);

    try {
      this.bbLoader.showLoader();
      const res = await firstValueFrom(
        this.transitionService.beginTransitionMapWithProduct(payload)
      );

      if (res?.success) {
        this.bbToaster.show_success('Transition initiated successfully');
        this.closeTransitionMdl.emit(true);
        // Emit productId values so the parent's filter (prod.productId) works correctly
        const selectedProductIdValues = this.selectedProducts
          .filter(p => this.selectedProductIds.includes(p._id))
          .map(p => p.productId);
        this.closeModalEvent.emit({ isUpdated: true, data: payload, selectedProducts: selectedProductIdValues });
        this.onCancelBeingTransistion();
      } else {
        this.bbToaster.show_warn(res?.message || 'Failed to initiate transition');
      }
    } catch (error) {
      console.error('Error initiating transition:', error);
      this.bbToaster.show_warn('An error occurred while initiating transition');
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  onCancelBeingTransistion(): void {
    this.processForm.get('actionowner')?.enable();
    this.showTransitionModal = false;
    this.processForm.reset();
    this.actionOwnerForm.reset();
    this.selectedProductIds = [];
    this.listItems = [];
    this.showActionOwnerModal = false;
    this.showEditActionOwnerModal = false;
    this.editingActionOwner = null;
    this.actionOwnerToDelete = null;
    this.modalService.dismissAll();
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  onNext() {
    this.markFormGroupTouched(this.processForm);

    if (!this.processForm.valid) {
      this.bbToaster.show_error('Please fill all required fields');
      return;
    }
    if (this.selectedProductIds.length === 0) {
      this.bbToaster.show_error('Please select at least one product');
      return;
    }
    this.actionOwnerVisible = true;
  }
  async onAddActionOwner() {
    await this.onUserSelection({ value: this.processForm.get('listItemsUsers')?.value });
    this.processForm.get('listItemsUsers')?.setValue([]);
    this.processForm.get('actionowner')?.setValue(null);
    this.processForm.get('actionowner')?.enable();
    this.isEditMode = false;
    this.updateMapping = false;
  }

  onClearActionOwner() {
    this.processForm.get('listItemsUsers')?.setValue([]);
    this.processForm.get('actionowner')?.setValue(null);
    this.processForm.get('actionowner')?.enable();
    this.isEditMode = false;
    this.updateMapping = false;
  }
  onActionOwnerChange(event: any) {
    if (this.listItems?.find((valL: any) => valL.actionOwnerId === event?.value)) {
      this.processForm.get("actionowner")?.setValue(null);
      this.bbToaster.show_info(
        `${this.listItems?.find((valL: any) => valL.actionOwnerId === event?.value)["Action Owner"]} has already been selected`
      );
      return;
    } else {
      this.isEditMode = true;
    }
  }
  onClickActionOwnerAction() {
    this.showActionOwnerModal = true;
    if (this.isEditMode) {
      const findActionOwner = this.actionOwnerList.find(owner => owner._id === this.processForm.get('actionowner')?.value);
      this.actionOwnerForm.get('cActionOwner')?.setValue(findActionOwner?.cActionOwner || '');
    }
  }

  async onUpdateActions() {
    if (this.listItems.length === 0) {
      this.bbToaster.show_error('At least one Action Owner mapping is required.');
      return;
    }
    try {
      const payload = {
        _id: this.transitionID,
        actionOwner: this.listItems.map((item: any) => ({
          actionOwnerId: item.actionOwnerId,
          users: item.userId
        }))
      }
      const res = await firstValueFrom(this.transitionService.updateBeginTransitionMapWithProduct(payload))
      if (res?.success) {
        this.bbToaster.show_success('Action owner mapping updated successfully');
        this.closeTransitionMdl.emit(true);
        this.closeModalEvent.emit({ isUpdated: true, payload, selectedProducts: this.selectedProductIds });
        this.onCancelBeingTransistion();
      } else {
        this.bbToaster.show_warn(res?.message || 'Failed to initiate transition');
      }
    } catch (error) {
      console.error('Error initiating transition:', error);
      this.bbToaster.show_warn('An error occurred while initiating transition');
    }
  }

  filterUserList() {
    const actionOwnerId = this.processForm.get('actionowner')?.value;

    /* ================= COLLECT ALL SELECTED USER IDS ================= */
    const allSelectedIds = new Set<string>(
      (this.listItems || [])
        .filter((item: any) =>
          !this.isEditMode || item?.actionOwnerId !== actionOwnerId
        )
        .flatMap((item: any) =>
          Array.isArray(item?.userId) ? item.userId : item?.userId ? [item.userId] : []
        )
    );

    /* ================= FIND ACTION OWNER ================= */
    const owner = this.actionOwnerList?.find(
      (val: any) => val._id === actionOwnerId
    );

    /* ================= CLIENT OWNER ================= */
    if (/^client/i.test(owner?.cActionOwner.toLowerCase() ?? '')) {
      return (this.contactList || []).map((c: any) => ({
        ...c,
        displayName: c.cDisplayName || c.cEmail || c.email,
        displayEmail: c.cEmail || c.email || '',
        loginName: `${c.cDisplayName || c.cEmail || c.email} - ${c.cEmail || c.email || ''}`
      }));
    }

    /* ================= INTERNAL USERS ================= */
    return (this.employeeList || []).filter(
      (user: any) => !allSelectedIds.has(user._id)
    );
  }

  onChangeUserList(_event: any) {
    if (!this.processForm.get("actionowner")?.value) {
      this.processForm?.get("listItemsUsers")?.setValue([]);
      this.bbToaster.show_warn("Please select an Action Owner.");
      return;
    }
  }
  trimValue(field: string) {
    const control = this.processForm.get(field);
    if (control?.value) {
      control.setValue(control.value.trim());
    }
  }

  async onNameChange(event: any) {
    const value = event.target.value.trim();

    // update trimmed value
    this.processForm.get('transitionName')?.setValue(value);

    if (value.length < 3) return;
    const res = await firstValueFrom(this.transitionService.checkTransitionName(this.processForm.get('transitionName')?.value));
    console.log('res: ', res);
    if (!res.status) {
      this.processForm.get('transitionName')?.setValue(null);
      this.bbToaster.show_warn(res.message);
      return;
    }
  }
}