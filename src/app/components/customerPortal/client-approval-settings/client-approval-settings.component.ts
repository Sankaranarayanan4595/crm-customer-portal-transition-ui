import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from "primeng/floatlabel";
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { SelectModule } from "primeng/select";
import { MultiSelectModule } from "primeng/multiselect";
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ExcelService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service';
import { BBLoaderService, BbStoreService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { CategoriesService } from 'projects/customer-management-ui/shared/categories/categories.service';
import { CustomerPortalService } from 'projects/crm-customer-portal-transition-ui/shared/customer-portal/customer-portal.service';
import { firstValueFrom } from 'rxjs';
import { AgGridDataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component';

@Component({
  selector: 'app-client-approval-settings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    FloatLabel,
    SelectModule,
    MultiSelectModule,
    InputIconModule,
    IconFieldModule,
    TooltipModule,
    MenuModule,
    TableModule,
    AgGridDataTableComponent
  ],
  templateUrl: './client-approval-settings.component.html',
  styleUrl: './client-approval-settings.component.scss'
})
export class ClientApprovalSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerPortal = inject(CustomerPortalService);
  private cdr = inject(ChangeDetectorRef);
  private bbToaster = inject(BBToastService);
  private bbloader = inject(BBLoaderService);
  private bbStore = inject(BbStoreService);
  private categoryService = inject(CategoriesService);
  private excelService = inject(ExcelService);

  clientApprovalSetting!: FormGroup;
  clientApprovalForm!: FormGroup;
  paginationPageSizeSelector = [25, 50, 75, 100, 150, 200];
  approvalOptions = [
    { label: 'All Transition', value: 'all_transition' },
    { label: 'Transition Wise', value: 'transition_wise' },
  ];
  gridApi: any;
  public gridOptions: any = {
    popupParent: document.body,
    onGridReady: (params: any) => {
      this.gridApi = params.api;
    },
  };
  mainTableColumns: any[] = [];
  filteredTableData: any = [];
  excelItems: MenuItem[] = [
    { label: "Excel", icon: "bi bi-file-earmark-excel before:text-[15px]", command: () => this.onExport("EXCEL") },
    { label: "CSV", icon: "bi bi-filetype-csv before:text-[15px]", command: () => this.onExport("CSV") },
  ];
  roleOptions: any = [];
  productServiceOptions: any = [];
  isSaving = false;
  transitionOptions: any = [];
  users: any = [];
  listItemsApprovers: any = [];
  showCompanyLevelApprovals: boolean = false;
  mainTableData: any[] = [];
  searchTerm: string = "";
  editingApprovalId: any = null;
  private editingId: string | null = null;
  private tempEditData: any = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {
    this.clientApprovalSetting = this.fb.group({
      approvalType: [null, Validators.required],
      productService: [null],
      transitionWise: [null],
    });

    this.clientApprovalForm = this.fb.group({
      role: [null, Validators.required],
      approvers: [null, Validators.required],
    });
  }

  private generateId(): string {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }

  private showError(message: string): void {
    this.bbToaster.show_error(message);
  }

  private showSuccess(message: string): void {
    this.bbToaster.show_success(message);
  }

  private showWarn(message: string): void {
    this.bbToaster.show_warn(message);
  }

  async ngOnInit() {
    try {
      this.bbloader.showLoader();
      await this.loadUsers();
      await this.loadClientProducts();
      await this.loadCustomerApproval();
    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.bbloader.hideLoader();
      this.cdr.detectChanges();
    }
  }

  async loadCustomerApproval() {
    try {
      const res: any = await firstValueFrom(
        this.customerPortal.loadCustomerApproval()
      );

      this.mainTableData = (res?.data || []).map((val: any) => {
        const roleColumns: any = {};
        (val.cUserRoles || []).forEach((role: any) => {
          const columnName = this.roleOptions?.find((i: any) => i.value === role.role);
          if (columnName) {
            roleColumns[columnName.label] = this.users
              .filter((user: any) => role.users?.includes(user._id))
              .map((u: any) => u.empName)
              .join(", ");
          }
        });
        return {
          Type: this.approvalOptions.find(app => app.value === val.type)?.label || val.type,
          ["Transition Names"]: val.transitions
            ?.map((tr: any) => tr.cTransition_Name)
            ?.join(", ") || "N/A",
          ["Is Active"]: val.bActive ? "Yes" : "No",
          ...roleColumns,
          ...val
        };
      });

      this.updateMainTableColumns();
      this.applyFilter();
    } catch (error) {
      console.error("Error loading customer approval:", error);
      this.showError("Failed to load approval configurations");
    }
  }

  async loadUsers() {
    try {
      this.bbloader.showLoader();
      this.users = await this.categoryService.getUsersParentFilter();
      this.users = this.users?.filter((u: any) => u._id !== this.bbStore.getItem('userId'));
      this.users.sort((a: any, b: any) =>
        a.empName.toLowerCase().localeCompare(b.empName.toLowerCase())
      );
    } catch (error) {
      this.showError("Failed to load users");
    } finally {
      this.bbloader.hideLoader();
    }
  }

  get approvalTypeValue() {
    return this.clientApprovalSetting.get('approvalType')?.value;
  }

  async loadClientProducts() {
    try {
      const response: any = await firstValueFrom(
        this.customerPortal.loadClientProducts()
      );

      const uniqueMap = new Map<string, any>();
      const uniqueRolesMap = new Map<string, any>();

      response?.data?.forEach((val: any) => {
        val?.productDetails?.forEach((prod: any) => {
          if (prod?._id && !uniqueMap.has(prod._id)) {
            uniqueMap.set(prod._id, {
              label: prod.cFeaturesDesc,
              value: prod._id
            });
          }
        });
        val?.roles?.forEach((ques: any) => {
          if (ques?.value && !uniqueRolesMap.has(ques.value)) {
            uniqueRolesMap.set(ques.value, {
              label: ques.label,
              value: ques.value
            });
          }
        });
      });

      this.productServiceOptions = Array.from(uniqueMap.values());
      this.transitionOptions = Array.from(
        new Map(
          (response?.data || []).map((val: any) => [
            val._id,
            {
              label: val.cTransition_Name,
              value: val._id,
            },
          ])
        ).values()
      );
      this.roleOptions = Array.from(uniqueRolesMap.values());

    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.cdr.detectChanges();
    }
  }

  applyFilter() {
    if (!this.searchTerm) {
      this.filteredTableData = [...this.mainTableData];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredTableData = this.mainTableData.filter(row => {
      return Object.values(row).some(value =>
        value !== null && value !== undefined && String(value).toLowerCase().includes(term)
      );
    });
  }

  updateMainTableColumns() {
    const columns: any[] = [
      { field: "Type", header: "Type", sortable: true, filter: "checkboxSearchFilter", width: 150 },
      { field: "Transition Names", header: "Transition Name(s)", sortable: true, filter: "checkboxSearchFilter", width: 150 },
    ];

    const roleSet = new Set<string>();
    this.mainTableData.forEach(item => {
      (item.cUserRoles || []).forEach((role: any) => {
        const columnName = this.roleOptions?.find((i: any) => i.value === role.role);
        if (role.role && columnName?.label) {
          roleSet.add(columnName.label);
        }
      });
    });

    Array.from(roleSet).forEach(roleName => {
      columns.push({ field: roleName, header: roleName, sortable: true, filter: "checkboxSearchFilter", width: 150 });
    });

    columns.push({ field: "Is Active", header: "Is Active", sortable: true, filter: "checkboxSearchFilter", width: 150 });
    columns.push({
      field: "actions", header: "Actions", sortable: false, filter: false, cellRenderer: () => `
        <span class="action-icons">
          <div class="d-flex align-items-center gap-4 mt-3">
            <i class="bi bi-pencil-square cursor-pointer" title="Edit approval" data-action="edit"></i>
            <i class="bi bi-trash text-danger cursor-pointer" title="Deactivate approval" data-action="delete"></i>
          </div>
        </span>
    `,
      onCellClicked: (params: any) => {
        const action = params.event.target
          ?.closest("[data-action]")
          ?.dataset["action"];

        if (!action) return;
        params.event.stopPropagation();

        action === "edit"
          ? this.openApprovalModal(params.data)
          : this.deleteApprovalConfiguration(params.data);
      },
    });

    this.mainTableColumns = columns;
    this.cdr.detectChanges();
  }

  openApprovalModal(approvalData?: any): void {
    if (approvalData) {
      this.editingApprovalId = approvalData._id;
      this.populateApprovalDataForEdit(approvalData);
    } else {
      this.editingApprovalId = null;
      if (!this.clientApprovalSetting.valid) {
        this.clientApprovalSetting.markAllAsTouched();
        this.showError('Please enter required Fields')
        return;
      }
    }
    this.showCompanyLevelApprovals = true;
  }

  private populateApprovalDataForEdit(approvalData: any): void {
    this.listItemsApprovers = [];

    this.clientApprovalSetting.patchValue({
      approvalType: approvalData.type
    });

    if (approvalData.type === 'transition_wise') {
      const transitionIds = approvalData.transitions?.map((t: any) => t._id) || [];
      this.clientApprovalSetting.patchValue({
        transitionWise: transitionIds
      });
    } else if (approvalData.type === 'Product/Service') {
      const productIds = approvalData.products?.map((p: any) => p._id) || [];
      this.clientApprovalSetting.patchValue({
        productService: productIds
      });
    }

    this.listItemsApprovers = (approvalData.cUserRoles || []).map((role: any, index: number) => {
      const selectedUsers = role.users || [];
      const selectedUserDetails = this.users.filter((u: any) =>
        selectedUsers.includes(u._id)
      );

      return {
        id: this.generateId(),
        level: `Level-${index + 1}`,
        role: role.role,
        approvers: selectedUsers,
        approverNames: selectedUserDetails.map((user: any) => user.empName).join(", "),
      };
    });

    this.cdr.detectChanges();
  }

  async cancelApprovalSettings() {
    this.showCompanyLevelApprovals = false;
    this.listItemsApprovers = [];
    this.clientApprovalForm.reset();
    this.clientApprovalSetting.reset();
    this.editingApprovalId = null;
    this.cancelEdit();
  }

  async saveApprovalSettings() {
    if (this.listItemsApprovers.length === 0) {
      this.showWarn("Please add at least one role");
      return;
    }

    const roles = this.listItemsApprovers.map((item: any) => item.role.toLowerCase());
    const uniqueRoles = new Set(roles);
    if (roles.length !== uniqueRoles.size) {
      this.showError("Each role must have a unique role");
      return;
    }

    const emptyApprovers = this.listItemsApprovers.some((item: any) =>
      !item.approvers || item.approvers.length === 0
    );

    if (emptyApprovers) {
      this.showError("Each role must have at least one role");
      return;
    }

    const approvalType = this.clientApprovalSetting.get('approvalType')?.value;
    if (!approvalType) {
      this.showError("Please select an role type");
      return;
    }

    let selectedIds = null;
    if (approvalType === 'Product/Service') {
      selectedIds = this.clientApprovalSetting.get('productService')?.value;
      if (!selectedIds || selectedIds.length === 0) {
        this.showError("Please select at least one product/service");
        return;
      }
    } else if (approvalType === 'transition_wise') {
      selectedIds = this.clientApprovalSetting.get('transitionWise')?.value;
      if (!selectedIds || selectedIds.length === 0) {
        this.showError("Please select at least one transition");
        return;
      }
    }

    this.bbloader.showLoader();

    const approvalSettings: any = {
      type: approvalType,
      transitonIds: selectedIds,
      cUserRoles: this.listItemsApprovers.map((item: any) => ({
        role: item.role,
        users: item.approvers,
      })),
      bActive: true
    };

    if (this.editingApprovalId) {
      approvalSettings._id = this.editingApprovalId;
    }

    try {
      this.isSaving = true;
      const res: any = await firstValueFrom(
        this.customerPortal.upsertCustomerConfigration(approvalSettings)
      );

      if (res?.success) {
        this.showSuccess(
          this.editingApprovalId
            ? "Role settings updated successfully"
            : "Role settings saved successfully"
        );
        await this.loadCustomerApproval();
        await this.cancelApprovalSettings();
      } else {
        this.showError(res.message || "Failed to save role settings");
      }
    } catch (error: any) {
      console.error("Error saving role settings:", error);
      this.showError(error.message || "An error occurred while saving");
    } finally {
      this.isSaving = false;
      this.bbloader.hideLoader();
    }
  }

  isFieldInvalidCompany(fieldName: string): boolean {
    const field = this.clientApprovalForm.get(fieldName);
    return !!field && field.invalid && field.touched;
  }

  isFieldCompany(fieldName: string): boolean {
    const field = this.clientApprovalSetting.get(fieldName);
    return !!field && field.invalid && field.touched;
  }

  addApprovalLevel(): void {
    if (!this.clientApprovalForm.valid) {
      this.clientApprovalForm.markAllAsTouched();
      return;
    }

    const formValue = this.clientApprovalForm.value;
    const roleName = formValue.role?.trim();

    if (!roleName) {
      this.showError("Please enter a role name");
      return;
    }

    const roleExists = this.listItemsApprovers.some((item: any) =>
      item.role.toLowerCase() === roleName.toLowerCase()
    );

    if (roleExists) {
      this.showError("This role has already been added. Please enter a different role.");
      return;
    }

    if (!formValue.approvers || formValue.approvers.length === 0) {
      this.showError("Please select at least one role");
      return;
    }

    const selectedUsers = this.users.filter((u: { _id: any; }) =>
      formValue.approvers.includes(u._id)
    );

    this.listItemsApprovers.push({
      id: this.generateId(),
      level: `Level-${this.listItemsApprovers.length + 1}`,
      role: roleName,
      approvers: formValue.approvers,
      approverNames: selectedUsers.map((user: any) => user.empName).join(", "),
    });

    this.clientApprovalForm.reset({ role: null, approvers: null });
    this.showSuccess(`Role(s) added successfully. Please click save to apply the change.`);
  }

  private startEdit(item: any): void {
    this.editingId = item.id;
    this.tempEditData = {
      id: item.id,
      role: item.role,
      approvers: [...item.approvers],
    };
  }

  updateTempRole(item: any, event: any) {
    this.startEdit(item);
    if (this.tempEditData && this.tempEditData.id === item.id) {
      this.tempEditData.role = event.value;
    }
    this.saveEdit(item.id);
  }

  updateTempApprovers(item: any, value: any[]): void {
    this.startEdit(item);
    if (this.tempEditData && this.tempEditData.id === item.id) {
      this.tempEditData.approvers = value;
    }
    this.saveEdit(item.id);
  }

  private saveEdit(id: string): void {
    if (!this.tempEditData) return;

    const index = this.listItemsApprovers.findIndex((item: { id: string; }) => item.id === id);
    if (index !== -1) {
      const currentItem = this.listItemsApprovers[index];
      const newRoleName = this.tempEditData.role?.trim();

      if (!newRoleName) {
        this.showError("Role name cannot be empty");
        this.cancelEdit();
        return;
      }

      if (newRoleName.toLowerCase() !== currentItem.role.toLowerCase()) {
        const roleExists = this.listItemsApprovers.some(
          (item: any) => item.id !== id &&
            item.role.toLowerCase() === newRoleName.toLowerCase()
        );
        if (roleExists) {
          this.showError("This role already exists. Please enter a different role.");
          // Revert to the old role value in tempEditData
          this.tempEditData.role = currentItem.role;
          // Update the UI to show the old role value
          const updatedIndex = this.listItemsApprovers.findIndex((item: { id: string; }) => item.id === id);
          if (updatedIndex !== -1) {
            this.listItemsApprovers[updatedIndex] = {
              ...this.listItemsApprovers[updatedIndex],
              role: currentItem.role
            };
          }
          this.cancelEdit();
          return;
        }
      }

      if (!this.tempEditData.approvers || this.tempEditData.approvers.length === 0) {
        this.showError("Please select at least one role");
        this.cancelEdit();
        return;
      }

      const selectedUsers = this.users.filter((u: { _id: any; }) =>
        this.tempEditData.approvers.includes(u._id)
      );

      this.listItemsApprovers[index] = {
        ...this.listItemsApprovers[index],
        role: newRoleName,
        approvers: this.tempEditData.approvers,
        approverNames: selectedUsers.map((user: any) => user.empName).join(", "),
      };

      this.showSuccess(`Role(s) updated successfully. Please click save to apply the change.`);
    }

    this.cancelEdit();
  }

  private cancelEdit(): void {
    this.editingId = null;
    this.tempEditData = null;
  }

  deleteApprover(id: string): void {
    if (this.listItemsApprovers?.length === 0) {
      this.showWarn('At least one role is required.');
      return;
    }
    this.listItemsApprovers = this.listItemsApprovers.filter((item: { id: string; }) => item.id !== id);

    if (this.editingId === id) {
      this.cancelEdit();
    }

    this.listItemsApprovers.forEach((item: any, index: number) => {
      item.level = `Level-${index + 1}`;
    });

    this.showSuccess("Role deleted successfully");
  }

  async deleteApprovalConfiguration(approvalData: any) {
    this.bbloader.showLoader();

    try {
      const payload = {
        _id: approvalData._id,
        bActive: false
      };

      const res: any = await firstValueFrom(
        this.customerPortal.upsertCustomerConfigration(payload)
      );

      if (res?.success) {
        this.showSuccess("Role configuration deactivated successfully");
        await this.loadCustomerApproval();
      } else {
        this.showError(res.message || "Failed to deactivate role configuration");
      }
    } catch (error: any) {
      console.error("Error deactivating role:", error);
      this.showError(error.message || "An error occurred while deactivating");
    } finally {
      this.bbloader.hideLoader();
    }
  }

  onAllSearchUnique(event: any) {
    this.searchTerm = (event.target.value || "").toLowerCase();
    this.applyFilter();
  }

  async clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  async onExport(exportType: string) {
    const fileName = "Transition_Settings_Role_Configuration";

    // ---------------------------------------------------
    // 1. Prepare ALL role columns
    // ---------------------------------------------------
    const allRoleColumns: string[] =
      (this.roleOptions || []).map((r: any) => r.label);

    const displayedRows: any[] = [];
    this.gridApi.forEachNodeAfterFilterAndSort((node: { data: any }) => {
      displayedRows.push(node.data);
    });

    // ---------------------------------------------------
    // 2. Build export rows
    // ---------------------------------------------------
    const exportData: any[] = (displayedRows ?? []).map((val: any) => {
      const roleColumns: any = {};

      // initialize empty
      allRoleColumns.forEach(label => {
        roleColumns[label] = "";
      });

      // fill role users
      (val.cUserRoles || []).forEach((role: any) => {
        const roleMeta = this.roleOptions?.find(
          (i: any) => i.value === role.role
        );

        if (roleMeta) {
          roleColumns[roleMeta.label] = this.users
            .filter((user: any) => role.users?.includes(user._id))
            .map((u: any) => u.empName)
            .join(", ");
        }
      });

      return {
        Type:
          this.approvalOptions.find(app => app.value === val.type)?.label ||
          val.type,

        "Transition Names":
          val.transitions?.length
            ? val.transitions.map((tr: any) => tr.cTransition_Name).join(", ")
            : "N/A",

        ...roleColumns,

        "Is Active": val.bActive ? "Yes" : "No",
      };
    });

    // ---------------------------------------------------
    // 3. Remove EMPTY role columns
    // ---------------------------------------------------
    const roleColumnsToKeep = allRoleColumns.filter(col =>
      exportData.some(row => row[col]?.trim())
    );

    const finalExportData = exportData.map(row => {
      const cleanedRow: any = {
        Type: row.Type,
        "Transition Names": row["Transition Names"],
      };

      roleColumnsToKeep.forEach(col => {
        cleanedRow[col] = row[col];
      });

      cleanedRow["Is Active"] = row["Is Active"];
      return cleanedRow;
    });

    // ---------------------------------------------------
    // 4. Export
    // ---------------------------------------------------
    switch (exportType) {
      case "EXCEL":
        this.excelService.ExportTOExcelWithImage(finalExportData, fileName);
        break;

      case "CSV":
        this.excelService.exportToCsv(finalExportData, fileName);
        break;
    }
  }

  onChangeType(event: any) {
    const transitionWiseCtrl = this.clientApprovalSetting.get('transitionWise');
    if (!transitionWiseCtrl) return;
    const alreadyExist = this.mainTableData?.find((item: any) => item?.type === 'all_transition' && event.value === 'all_transition');
    if (alreadyExist) {
      this.clientApprovalSetting.get('approvalType')?.setValue(null)
      this.showWarn(`${alreadyExist.Type} already Exist`)
    }

    if (event.value === 'transition_wise') {
      transitionWiseCtrl.setValidators([Validators.required]);
    } else {
      transitionWiseCtrl.clearValidators();
      transitionWiseCtrl.setValue(null);
    }

    transitionWiseCtrl.updateValueAndValidity();
  }

  onChangeTransitionWise(event: any) {
    const selectedTransitionIds = event.value || [];

    if (selectedTransitionIds.length === 0) {
      return;
    }

    const duplicateTransitionNames: string[] = [];

    this.mainTableData.forEach((config: any) => {
      if (this.editingApprovalId && config._id === this.editingApprovalId) {
        return;
      }

      const existingTransitionIds = config.transitions?.map((t: any) => t._id) || [];
      const overlappingIds = selectedTransitionIds.filter((id: string) =>
        existingTransitionIds.includes(id)
      );

      if (overlappingIds.length > 0) {
        const overlappingNames = this.transitionOptions
          .filter((opt: any) => overlappingIds.includes(opt.value))
          .map((opt: any) => opt.label);
        duplicateTransitionNames.push(...overlappingNames);
      }
    });

    if (duplicateTransitionNames.length > 0) {
      const uniqueDuplicateNames = [...new Set(duplicateTransitionNames)];
      const errorMessage = `The following transition(s) are already configured: ${uniqueDuplicateNames.join(", ")}. Please select different transitions or edit the existing configuration.`;
      this.showError(errorMessage);

      const currentValue = this.clientApprovalSetting.get('transitionWise')?.value || [];
      const validSelections = currentValue.filter((id: string) =>
        !duplicateTransitionNames.some(name =>
          this.transitionOptions.find((opt: any) => opt.value === id)?.label === name
        )
      );
      this.clientApprovalSetting.patchValue({ transitionWise: validSelections });
    }
  }
}