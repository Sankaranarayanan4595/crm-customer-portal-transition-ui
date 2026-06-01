import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  ViewChild,
} from "@angular/core";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { ButtonModule } from "primeng/button";
import { PopoverModule } from "primeng/popover";
import { DialogModule } from "primeng/dialog"; // Needed for the New View Modal
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";

import { AgGridDataTableComponent } from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component";
import { AgGridDynamicHeightDirective } from "../../sharedUI/directives/ag-grid-header-height/ag-grid-dynamic-height.directive";

// Inject your services
import { CustomerService } from "projects/customer-management-ui/shared/customer/customer.service";
import { BbStoreService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { BBLoaderService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";

import { FloatLabel } from "primeng/floatlabel";
import { InputTextModule } from "primeng/inputtext";
import { CheckboxModule } from "primeng/checkbox";
import { TextareaModule } from "primeng/textarea";
import { MultiSelectModule } from "primeng/multiselect";
import { MenuModule } from "primeng/menu";
import { MenuItem } from "primeng/api";
import { Tooltip } from "primeng/tooltip";
import { LucideAngularModule } from "lucide-angular";
// import { AgGridDataTableService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.service';
@Component({
  selector: "app-grid-table",
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    PopoverModule,
    DialogModule,
    FloatLabel,
    CheckboxModule,
    InputTextModule,
    TextareaModule,
    MultiSelectModule,
    AgGridDataTableComponent,
    AgGridDynamicHeightDirective,
    LucideAngularModule,
    MenuModule,
    Tooltip,
  ],
  templateUrl: "./grid-table.component.html",
  styleUrl: "./grid-table.component.scss",
})
export class GridTableComponent implements OnInit, OnChanges {
  private oCustomerService = inject(CustomerService);
  private BbStoreService = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private bbStore = inject(BbStoreService);
  private bbLoader = inject(BBLoaderService);
  private categoryService = inject(CategoriesService);
  private router = inject(Router);
  // private AgGridDataTableService = inject(AgGridDataTableService);

  @Output() defaultViewLoaded = new EventEmitter<void>();
  fieldColumnList: any = {};
  @Input() tableData: any[] = [];
  @Input() columns: any[] = [];
  @Input() themeClass: string = "ag-theme-alpine";
  @Input() gridOptions: any;
  @Input() paginationPageSizeSelector: number[] = [25, 50, 75, 100, 150, 200];
  @Input() viewCategory: string = "general";
  @Input() heightOffset?: number;
  @Input() externalFilters: any = {};

  // SSR Pagination passthrough inputs
  @Input() customPagination: boolean = false;
  @Input() customSSRPagination: boolean = false;
  @Input() ssrTotalRecords: number = 0;
  @Input() ssrPageSize: number = 50;
  @Input() ssrCurrentPage: number = 0;
  @Input() groupKeyandCustomPagination: boolean = false;
  @Output() onPaginationChangeCustom = new EventEmitter<{ page: number; limit: number }>();

  // ==========================================
  // OUTPUTS (Actions Parent needs to know about)
  // ==========================================
  @Output() deleteClicked = new EventEmitter<any>();
  @Output() editClicked = new EventEmitter<any>();
  @Output() externalFiltersApplied = new EventEmitter<any>();
  @Output() initialViewSetupComplete = new EventEmitter<void>();
  private hasEmittedInit = false;

  private emitInitComplete() {
    if (!this.hasEmittedInit) {
      this.hasEmittedInit = true;
      this.initialViewSetupComplete.emit();
    }
  }

  // ==========================================
  // INTERNAL STATE (Managed by this component)
  // ==========================================
  activeViewId: string = "default";
  activeViewName: string = "Standard View";
  hasUnsavedChanges: boolean = false;
  isSharedView: boolean = false;
  manageColumnsAgGrid: boolean = false;

  @Input() showViewedFlag: boolean = false;
  @Input() showFilterFlag: boolean = false;
  @Input() moduleType: string = "General";

  savedViews: any[] = [];
  myViewsList: any[] = [];
  sharedViewsList: any[] = [];
  favoriteViewsList: any[] = [];

  gridApi: any;
  pendingView: any = null;
  isApplyingView: boolean = false;
  isLocalEmit: boolean = false;
  originalColumnDefs: any[] = [];
  private silenceTimer: any;

  @ViewChild("saveMenu") saveMenu: any;

  viewActionItems: MenuItem[] = [];
  selectedViewForAction: any = null;
  saveViewMenuItems: MenuItem[] = [];

  prepareSaveViewMenu() {
    this.saveViewMenuItems = [];

    // CASE 1: My View (owned by current user and not default)
    if (this.activeViewId !== "default" && !this.isSharedView) {
      this.saveViewMenuItems.push({
        label: "Save changes",
        icon: "pi pi-check",
        command: () => this.handleSaveCurrentView(),
      });
      this.saveViewMenuItems.push({
        label: "Save as new view",
        icon: "pi pi-plus",
        command: () => this.openCreateNewViewModal(),
      });
    }
    // CASE 2: Default View or Shared View
    else {
      // For these, we only allow creating a NEW view
      this.saveViewMenuItems.push({
        label: "Save changes",
        icon: "pi pi-check",
        command: () => this.openCreateNewViewModal(),
      });
    }
  }

  handleSaveViewClick(event: any) {
    this.prepareSaveViewMenu();
    // If it's a "My View", toggle the menu
    if (this.activeViewId !== "default" && !this.isSharedView) {
      this.saveMenu.toggle(event);
    } else {
      // For Default/Shared, just trigger the create modal directly (matching the single "Save View" option)
      this.openCreateNewViewModal();
    }
  }

  prepareViewActions(view: any, event: Event) {
    event.stopPropagation();
    this.selectedViewForAction = view;

    this.viewActionItems = [
      {
        label: "Save as new view",
        icon: "pi pi-plus",
        command: () => {
          this.openCreateNewViewModal(this.selectedViewForAction);
        },
      },
      {
        label: "Edit view",
        icon: "pi pi-pencil",
        command: () => {
          this.openEditViewModal(this.selectedViewForAction, new MouseEvent("click") as any);
        },
      },
      {
        label: "Delete view",
        icon: "pi pi-trash",
        command: () => {
          this.confirmDeleteView(this.selectedViewForAction, new MouseEvent("click") as any);
        },
      },
    ];
  }

  navigateToManageViews() {
    this.router.navigate(["/manageviews", this.moduleType.toLowerCase()]);
  }

  get currentGridApi() {
    return this.gridApi || this.gridOptions?.api;
  }

  private setApplyingView(isApplying: boolean, delay: number = 2000) {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }
    this.isApplyingView = isApplying;
    if (isApplying) {
      this.silenceTimer = setTimeout(() => {
        this.isApplyingView = false;
      }, delay);
    }
  }

  // New View Modal State
  newViewModalOpen: boolean = false;
  isEditingView: boolean = false;
  editingViewId: string | null = null;
  newViewName: string = "";
  newViewDescription: string = "";
  newViewSetAsDefault: boolean = false;
  selectedList: any[] = []; // List of all users for dropdown
  selectedUser: any[] = []; // Users selected to share with

  // Unsaved changes confirmation state
  confirmForecastMdl: boolean = false;
  pendingViewToSwitch: any = null;

  // Delete View confirmation state
  deleteViewConfirmMdl: boolean = false;
  viewToDelete: any = null;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}

  registerGridEvent(eventName: string, handler: (params: any) => void) {
    if (!this.gridOptions) {
      this.gridOptions = {};
    }
    const originalHandler = this.gridOptions[eventName];
    this.gridOptions[eventName] = (params: any) => {
      handler(params);
      if (originalHandler) {
        originalHandler(params);
      }
    };
  }

  ngOnInit() {
    // console.log(this.currentGridApi, "currentGridApi");
    this.setApplyingView(true, 3000); // Silence events during startup
    this.loadViews();
    this.loadUsers();
    // Ensure gridOptions exists
    if (!this.gridOptions) {
      this.gridOptions = {};
    }

    // Save any existing onGridReady function passed from the parent dashboard
    const originalOnGridReady = this.gridOptions.onGridReady;

    // Hijack the onGridReady property to force it to trigger our local method
    this.gridOptions.onGridReady = (params: any) => {
      // 1. Trigger our component's logic!
      this.onGridReady(params);

      // 2. If the parent dashboard also had logic here, run it too
      if (originalOnGridReady) {
        originalOnGridReady(params);
      }
    };

    const markAsModifiedHandler = (params: any) => {
      if (params) {
        // Safe check to avoid strict unused variable check
      }
      if (this.isApplyingView) {
        return;
      }

      // Explicitly allow ONLY events generated by direct UI interactions.
      // Events like 'sizeColumnsToFit', 'api', 'flex', 'autosizeColumns',
      // 'columnState' happen programmatically (e.g. initial load) and should NOT mark as unsaved.
      const uiSources = [
        "uiColumnMoved",
        "uiColumnDragged",
        "uiColumnResized",
        "uiColumnSorted",
        "uiColumnPinned",
        "uiColumnVisible",
        "columnFilter",
        "toolPanelUi",
      ];

      if (params?.source && !uiSources.includes(params.source)) {
        return;
      }

      this.hasUnsavedChanges = true;
    };

    // Register all required AG Grid column and state change events
    const eventsToListen = [
      "onColumnMoved",
      "onColumnPinned",
      "onColumnVisible",
      "onColumnResized",
      "onSortChanged",
      "onFilterChanged",
      "onColumnPivotModeChanged",
      "onColumnRowGroupChanged",
      "onColumnPivotChanged",
      "onColumnValueChanged",
    ];

    eventsToListen.forEach((event) => {
      this.registerGridEvent(event, markAsModifiedHandler);
    });

    this.prepareSaveViewMenu();
  }

  // Fetch users for the MultiSelect
  async loadUsers(): Promise<void> {
    try {
      const currentUserId = this.BbStoreService.getItem("userId");
      const users = await this.categoryService.getUsers();

      if (users && Array.isArray(users)) {
        this.selectedList = users.filter((user: any) => {
          // 1. Exclude the current logged-in user
          const isNotSelf = String(user._id) !== String(currentUserId);

          // 2. Strict check: property must exist, not be null, and not be empty string
          const hasValidName =
            user.empName !== undefined &&
            user.empName !== "undefined" &&
            user.empName !== null &&
            String(user.empName).trim() !== "";

          return isNotSelf && hasValidName;
        });
      }
    } catch (error) {
      console.error("Failed to load users for share list", error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.isLocalEmit) {
      this.isLocalEmit = false;
      return;
    }
    // 1. Capture original column definitions from parent (these contain the cellRenderers, etc.)
    if (changes["columns"] && changes["columns"].currentValue && changes["columns"].currentValue.length > 0) {
      this.originalColumnDefs = [...changes["columns"].currentValue];
    }

    // On first change of columns or tableData: treat it as a fresh start (silence unsaved tracking)
    if (
      (changes["columns"] && changes["columns"].firstChange) ||
      (changes["tableData"] && changes["tableData"].firstChange)
    ) {
      this.setApplyingView(true, 3000);
    }

    // When parent pushes a new [columns] value after initialisation:
    // If a custom view is currently active, the view's column config (set by applyView)
    // must take precedence — do NOT let parent's allColumns overwrite it.
    if (changes["columns"] && !changes["columns"].firstChange) {
      if (this.activeViewId && this.activeViewId !== "default") {
        const activeView = this.savedViews.find((v: any) => v._id === this.activeViewId);
        if (activeView && activeView.config && activeView.config.columns) {
          // Restore the active view's column layout silently (no filter emits, no isApplyingView reset)
          this.restoreViewColumns(activeView);
          return;
        }
      }
    }

    // Note: externalFilters changes (searchTerm, status, classification) are transient
    // filter/search state and intentionally do NOT set hasUnsavedChanges.
    // hasUnsavedChanges is reserved for actual column configuration changes
    // (column moves, pins, resizes, sort, ag-Grid filter model) so that
    // navigation is only blocked when the user has unsaved column layout changes.
  }

  async loadViews() {
    try {
      const res: any = await firstValueFrom(this.oCustomerService.getViews());
      // Normalize IDs to strings to handle both plain strings and {$oid: "..."} objects
      this.savedViews = (res.data || [])
        .filter((v: any) => v.moduleType === this.moduleType)
        .map((v: any) => ({
          ...v,
          _id: v._id?.$oid || v._id,
        }));

      const currentUserId = this.BbStoreService.getItem("userId");

      // Filter all favorites first
      this.favoriteViewsList = this.savedViews.filter((v: any) => v.isFavorite === true);

      this.myViewsList = this.savedViews
        .filter((v: any) => {
          const uid = v.userId?.$oid || v.userId;
          const isMyView = v && uid && String(uid) === String(currentUserId);
          return isMyView;
        })
        .sort((a, b) => {
          const aFav = a.isFavorite ? 1 : 0;
          const bFav = b.isFavorite ? 1 : 0;
          return bFav - aFav;
        });

      this.sharedViewsList = this.savedViews
        .filter((v: any) => {
          if (!v || !v.userId) return false;
          const uid = v.userId?.$oid || v.userId;
          const isMyView = String(uid) === String(currentUserId);
          if (isMyView) return false;

          const sharedWith = Array.isArray(v.sharedWith) ? v.sharedWith : [];
          const isShared = sharedWith.some((id: any) => {
            const sid = id?.$oid || id;
            return String(sid) === String(currentUserId);
          });
          return isShared;
        })
        .sort((a, b) => {
          const aFav = a.isFavorite ? 1 : 0;
          const bFav = b.isFavorite ? 1 : 0;
          return bFav - aFav;
        });

      // Persistence logic: Check localStorage first, then the view marked as isDefault
      const lastSelectedId = this.bbStore.getItem(`${this.moduleType}_activeViewId`);
      let startupView = this.savedViews.find((v: any) => v._id === lastSelectedId);

      if (!startupView) {
        startupView = this.myViewsList.find((v: any) => v.isDefault);
      }

      if (startupView) {
        this.activeViewId = startupView._id;
        this.activeViewName = startupView.name;
        if (this.gridApi) this.applyView(startupView, true);
        else this.pendingView = startupView;
      } else {
        this.activeViewId = "default";
        this.activeViewName = "Standard View";
        this.bbStore.setItem(`${this.moduleType}_activeViewId`, "default");
        if (this.gridApi) {
          this.emitInitComplete();
        } else {
          this.pendingView = "default";
        }
      }
      this.prepareSaveViewMenu();
    } catch (err) {
      console.error("Load views error:", err);
    }
  }

  isOwnView(view: any): boolean {
    if (!view) return false;
    const currentUserId = this.BbStoreService.getItem("userId");
    const uid = view.userId?.$oid || view.userId;
    return uid && String(uid) === String(currentUserId);
  }

  async toggleFavoriteView(view: any, event: Event) {
    if (event) {
      event.stopPropagation();
    }
    const newFavoriteState = !view.isFavorite;
    try {
      this.bbLoader.showLoader();
      const payload = { isFavorite: newFavoriteState };
      const res: any = await firstValueFrom(this.oCustomerService.updateView(view._id, payload));
      if (res.success === false) {
        this.bbToaster.show_warn(res.message || "Failed to update favorite status");
        return;
      }
      this.bbToaster.show_success(newFavoriteState ? "View added to Favorites" : "View removed from Favorites");
      await this.loadViews();
    } catch (err: any) {
      console.error("Failed to toggle favorite view:", err);
      this.bbToaster.show_error(err.message || "Failed to update favorite status");
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  // Modal Control Methods
  resetNewViewForm() {
    this.newViewName = "";
    this.newViewDescription = "";
    this.newViewSetAsDefault = false;
    this.selectedUser = [];
    this.isEditingView = false;
    this.editingViewId = null;
  }
  onCancelNewView() {
    this.newViewModalOpen = false;
    this.resetNewViewForm();
  }

  openEditViewModal(view: any, event: Event) {
    event.stopPropagation(); // Prevent view switch
    this.resetNewViewForm();
    this.isEditingView = true;
    this.editingViewId = view._id;
    this.newViewName = view.name;
    this.newViewDescription = view.description || "";
    this.newViewSetAsDefault = view.isDefault || false;

    // Map sharedWith IDs to selectedUser objects
    if (Array.isArray(view.sharedWith)) {
      this.selectedUser = this.selectedList.filter((u) =>
        view.sharedWith.some((id: any) => String(id?.$oid || id) === String(u._id))
      );
    }

    this.newViewModalOpen = true;
  }

  openCreateNewViewModal(view?: any) {
    this.resetNewViewForm();
    this.isEditingView = false;

    // Use passed view or fallback to the currently active view
    let targetView = view;
    if (!targetView && this.activeViewId && this.activeViewId !== "default") {
      targetView = this.savedViews.find((v) => v._id === this.activeViewId);
    }

    if (targetView) {
      this.newViewName = `${targetView.name || targetView["View Name"] || ""} (Copy)`;
      this.newViewDescription = targetView.description || "";
    } else {
      // Fallback for default/Standard view - do not patch the view name (keep it empty)
      this.newViewName = "";
      this.newViewDescription = "";
    }

    this.newViewModalOpen = true;
  }

  confirmDeleteView(view: any, event: Event) {
    event.stopPropagation(); // Prevent view switch
    this.viewToDelete = view;
    this.deleteViewConfirmMdl = true;
  }

  cancelDeleteView() {
    this.deleteViewConfirmMdl = false;
    this.viewToDelete = null;
  }

  async executeDeleteView() {
    if (!this.viewToDelete) return;

    try {
      this.bbLoader.showLoader();
      const res: any = await firstValueFrom(this.oCustomerService.deleteView(this.viewToDelete._id));

      if (res.success === false) {
        this.bbToaster.show_warn(res.message || "Failed to delete view");
        return;
      }

      this.bbToaster.show_success("View deleted successfully");

      // If the deleted view was active, switch to default
      if (this.activeViewId === this.viewToDelete._id) {
        this.applyDefaultView();
      }

      // Refresh local lists
      this.savedViews = this.savedViews.filter((v) => v._id !== this.viewToDelete._id);
      const currentUserId = this.BbStoreService.getItem("userId");
      this.myViewsList = this.savedViews.filter((v: any) => {
        const uid = v.userId?.$oid || v.userId;
        return v && uid && String(uid) === String(currentUserId);
      });

      this.deleteViewConfirmMdl = false;
      this.viewToDelete = null;
    } catch (error: any) {
      console.error("Delete view error:", error);
      this.bbToaster.show_error(error.message || "Failed to delete view");
    } finally {
      this.bbLoader.hideLoader();
    }
  }
  onGridReady(params: any) {
    this.isApplyingView = true;
    this.gridApi = params.api;
    // console.log("Grid is ready! API:", this.gridApi);

    // Capture original definitions to ensure we can always restore system columns
    if (this.originalColumnDefs.length === 0) {
      this.originalColumnDefs = this.gridApi.getColumnDefs() || [];
    }

    if (this.pendingView) {
      setTimeout(() => {
        if (this.pendingView === "default") {
          this.emitInitComplete();
        } else {
          this.applyView(this.pendingView, true);
        }
        this.pendingView = null;
      }, 100);
    } else {
      // If no pending view, we are on Default.
      // Wait for grid to settle before enabling change detection.
      this.setApplyingView(true, 3000);
    }
  }

  getCurrentConfig() {
    if (!this.gridApi) return {};
    const columnState = this.gridApi.getColumnState() || [];
    const filterModel = this.gridApi.getFilterModel() || {};

    // 1. Sync current column definitions with grid state (visibility, order, width)
    const currentColumns = columnState
      .map((state: any) => {
        // Find original definition to preserve non-state properties (cellRenderer, etc.)
        const originalCol = this.columns.find((c: any) => (c.field || c.colId) === state.colId);
        if (!originalCol) return null;
        return {
          ...originalCol,
          hide: state.hide,
          width: state.width,
          pinned: state.pinned,
          sort: state.sort,
          sortIndex: state.sortIndex,
        };
      })
      .filter((c: any) => c !== null);

    // Add back any columns that might be missing from state but exist in definitions
    this.columns.forEach((col: any) => {
      const field = col.field || col.colId;
      if (!currentColumns.find((c: any) => (c.field || c.colId) === field)) {
        currentColumns.push(col);
      }
    });

    return {
      columns: currentColumns,
      filters: filterModel,
      sorting: {},
      columnOrder: columnState,
      tableState: {
        sortField: columnState.find((c: any) => c.sort)?.colId || null,
        sortOrder:
          columnState.find((c: any) => c.sort)?.sort === "asc"
            ? 1
            : columnState.find((c: any) => c.sort)?.sort === "desc"
              ? -1
              : 0,
        filters: filterModel,
        hasActiveSort: columnState.some((c: any) => c.sort),
        hasActiveFilter: Object.keys(filterModel).length > 0,
      },
      externalFilters: this.externalFilters,
    };
  }

  restoreViewColumns(view: any) {
    if (view && view.config && view.config.columns && Array.isArray(view.config.columns)) {
      const restoredColumns = view.config.columns.map((savedCol: any) => {
        const field = savedCol.field || savedCol.colId;
        const origCol = this.originalColumnDefs.find((c: any) => (c.field || c.colId) === field);
        if (origCol) {
          return {
            ...origCol,
            hide: savedCol.hide,
            width: savedCol.width,
            pinned: savedCol.pinned,
            sort: savedCol.sort,
            sortIndex: savedCol.sortIndex,
          };
        }
        return savedCol;
      });

      this.originalColumnDefs.forEach((origCol: any) => {
        const field = origCol.field || origCol.colId;
        if (!restoredColumns.find((c: any) => (c.field || c.colId) === field)) {
          restoredColumns.push(origCol);
        }
      });

      this.columns = restoredColumns;

      if (this.gridApi) {
        setTimeout(() => {
          if (view.config.columnState) {
            this.gridApi.applyColumnState({ state: view.config.columnState, applyOrder: true });
          }
        }, 100);
      }
    }
  }

  applyView(view: any, isInit: boolean = false) {
    this.setApplyingView(true, 1000);
    this.activeViewId = view._id;
    this.activeViewName = view.name;
    this.bbStore.setItem(`${this.moduleType}_activeViewId`, view._id);
    const currentUserId = this.BbStoreService.getItem("userId");
    const viewUserId = view.userId?.$oid || view.userId;
    this.isSharedView = String(viewUserId) !== String(currentUserId);

    if (view.config) {
      const hasSavedState =
        !!this.bbStore.getItem("accountfilterSearchTerm") || !!this.bbStore.getItem("accountSearchTerm");

      if (!isInit || !hasSavedState) {
        if (view.config.externalFilters) {
          this.externalFiltersApplied.emit(view.config.externalFilters);
        } else {
          this.externalFiltersApplied.emit({
            searchTerm: "",
            selectedClassifications: [],
            selectedStatus: "all",
            selectedSubStatus: "",
            selectedView: { name: "All List", code: "All List" },
          });
        }
      }

      // 1. Restore column definitions (handles visibility and order)
      this.restoreViewColumns(view);

      // 2. Apply state to grid API (with a slight delay to ensure columns are rendered)
      if (this.gridApi) {
        setTimeout(() => {
          if (!isInit || !hasSavedState) {
            const fModel = view.config.filterModel || view.config.filters;
            if (fModel) {
              this.gridApi.setFilterModel(fModel);
            } else {
              this.gridApi.setFilterModel(null);
            }
          }
          if (isInit) {
            this.emitInitComplete();
          }
        }, 100);
      }
    }

    // Silence events for a bit longer while the grid settles from state application
    this.hasUnsavedChanges = false;
    this.setApplyingView(true, 2000);

    // const columnStateToApply = view?.config?.columnState || this.columns.map((col: any) => ({
    //   colId: col.colId || col.field,
    //   hide: col.hide || false,
    //   pinned: col.pinned || null,
    //   sort: col.sort || null,
    //   width: col.width || undefined
    // }));

    // setTimeout(() => {
    //   this.AgGridDataTableService.clickRun({
    //     returnCol: [...this.columns],
    //     columnsData: columnStateToApply,
    //     tableData: this.tableData,
    //     msg: "reload"
    //   });
    // }, 100);
  }

  applyDefaultView() {
    this.hasUnsavedChanges = false;
    this.setApplyingView(true, 2000);
    this.isSharedView = false;
    this.activeViewId = "default";
    this.activeViewName = "Standard View";
    this.bbStore.setItem(`${this.moduleType}_activeViewId`, "default");

    // Restore the actual original columns from initialization
    if (this.originalColumnDefs.length > 0) {
      this.columns = this.originalColumnDefs.map((c: any) => ({ ...c }));

      //  console.log("applyDefaultView", this.originalColumnDefs);
    }

    // const defaultColumnState = this.originalColumnDefs.map((col: any) => ({
    //   colId: col.colId || col.field,
    //   hide: col.hide || false,
    //   pinned: col.pinned || null,
    //   sort: col.sort || null,
    //   width: col.width || undefined
    // }));

    if (this.gridApi) {
      setTimeout(() => {
        this.gridApi.resetColumnState();
        this.gridApi.setFilterModel(null);
        this.defaultViewLoaded.emit();

        // this.AgGridDataTableService.clickRun({
        //   returnCol: [...this.columns],
        //   columnsData: defaultColumnState,
        //   tableData: this.tableData,
        //   msg: ""
        // });
      }, 0);
    }
    this.hasUnsavedChanges = false;
  }

  confirmViewSwitch(view: any) {
    const viewId = typeof view === "string" ? view : view._id;
    if (this.activeViewId === viewId) return;

    if (this.hasUnsavedChanges) {
      this.pendingViewToSwitch = view;
      this.confirmForecastMdl = true;
    } else {
      this.executeViewSwitch(view);
    }
  }

  cancelForcastChange() {
    this.confirmForecastMdl = false;
    this.pendingViewToSwitch = null;
  }

  confirmForcastChange() {
    this.confirmForecastMdl = false;
    if (this.pendingViewToSwitch) {
      this.executeViewSwitch(this.pendingViewToSwitch);
      this.pendingViewToSwitch = null;
    }
  }

  private executeViewSwitch(view: any) {
    const viewId = typeof view === "string" ? view : view._id;
    if (viewId === "default") {
      this.applyDefaultView();
    } else {
      this.applyView(view);
    }
  }

  ismanageColumns() {
    this.manageColumnsAgGrid = true;
    setTimeout(() => {
      this.manageColumnsAgGrid = false;
    }, 100);
  }

  @Output() columnsChanged = new EventEmitter<any[]>();

  // Detect unsaved changes
  fieldColumnChanges(data: any) {
    this.fieldColumnList = data;

    // Sync parent columns state (sort, visibility, order) to prevent stale data push-back
    if (data?.columnState && this.columns) {
      const stateMap = new Map<string, any>(data.columnState.map((s: any, idx: number) => [s.colId, { ...s, idx }]));
      this.columns.forEach((col: any) => {
        const state = stateMap.get(col.field || col.colId);
        if (state) {
          col.hide = state.hide;
          col.sort = state.sort;
          col.sortIndex = state.sortIndex;
        }
      });
      // Match the grid's column order
      this.columns.sort((a: any, b: any) => {
        const stateA = stateMap.get(a.field || a.colId);
        const stateB = stateMap.get(b.field || b.colId);
        const idxA = stateA ? stateA.idx : 999;
        const idxB = stateB ? stateB.idx : 999;
        return idxA - idxB;
      });

      // Emit the updated columns to parent to maintain sync
      this.isLocalEmit = true;
      // this.columnsChanged.emit([...this.columns]);
    }
    // Note: hasUnsavedChanges is intentionally NOT set here.
    // fieldColumnChanges is triggered by syncColumnDrawerList() which fires on every
    // data refresh (search, filter, sort). hasUnsavedChanges is tracked exclusively
    // by markAsModifiedHandler which responds only to genuine user column interactions
    // (drag, resize, pin, sort via header, ag-Grid filter model) with a source!='api' guard.
  }
  onVisibleColumnsChanged(event: any) {
    console.log("event: ", event);
    if (!this.isApplyingView) {
      this.hasUnsavedChanges = true;
    }
  }

  async handleCreateView() {
    const trimmedName = this.newViewName?.trim();
    if (!trimmedName) {
      this.bbToaster.show_warn("View name is required");
      return;
    }

    // Validation: Forbidden name "Default View"
    if (trimmedName.toLowerCase() === "default view") {
      this.bbToaster.show_warn("The name 'Default View' is reserved.");
      return;
    }

    // Validation: Duplicate name for this user
    const isDuplicate = this.myViewsList.some(
      (v) => v.name.toLowerCase() === trimmedName.toLowerCase() && v._id !== this.editingViewId
    );

    if (isDuplicate) {
      this.bbToaster.show_warn(`A view named "${trimmedName}" already exists.`);
      return;
    }

    try {
      this.bbLoader.showLoader();
      const payload: any = {
        name: trimmedName,
        description: this.newViewDescription?.trim() || "",
        isDefault: this.newViewSetAsDefault,
        moduleType: this.moduleType,
        sharedWith: Array.isArray(this.selectedUser) ? this.selectedUser.map((u: any) => u._id || u) : [],
        config: this.getCurrentConfig(),
      };

      if (!this.isEditingView) {
        payload.config = this.getCurrentConfig();
        const res: any = await firstValueFrom(this.oCustomerService.createView(payload));
        if (res.success === false) {
          this.bbToaster.show_warn(res.message || "Failed to create view");
          return;
        }
        const newView = { ...res.data, _id: res.data._id?.$oid || res.data._id };
        this.savedViews.push(newView);
        this.bbToaster.show_success("View created successfully");
        this.applyView(newView);
      } else {
        // Update existing view
        const res: any = await firstValueFrom(this.oCustomerService.updateView(this.editingViewId!, payload));
        if (res.success === false) {
          this.bbToaster.show_warn(res.message || "Failed to save view");
          return;
        }
        const updatedView = { ...res.data, _id: res.data._id?.$oid || res.data._id };

        // Update local lists
        const index = this.savedViews.findIndex((v) => v._id === this.editingViewId);
        if (index !== -1) this.savedViews[index] = updatedView;

        this.bbToaster.show_success("View saved successfully");

        // If we are currently on this view, re-apply it to reflect changes (like description/default)
        if (this.activeViewId === this.editingViewId) {
          this.activeViewName = updatedView.name;
        }
      }

      // Refresh MyViewsList
      const currentUserId = this.BbStoreService.getItem("userId");
      this.myViewsList = this.savedViews.filter((v: any) => {
        const uid = v.userId?.$oid || v.userId;
        return v && uid && String(uid) === String(currentUserId);
      });

      this.newViewModalOpen = false;
      this.resetNewViewForm();
      this.hasUnsavedChanges = false;
    } catch (error: any) {
      console.error("View operation error:", error);
      this.bbToaster.show_error(error.message || "Failed to process view");
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  handleSaveCurrentView() {
    if (this.isSharedView) {
      this.bbToaster.show_warn("You cannot modify a shared view");
      return;
    }
    if (!this.activeViewId || this.activeViewId === "default") return;

    const currentView = this.savedViews.find((v) => v._id === this.activeViewId);
    if (currentView) {
      // Open the modal with current view data
      this.openEditViewModal(currentView, new MouseEvent("click") as any);
    }
  }
  resetToDefaultFn(event: any) {
    if (event) {
      const currentView = this.savedViews.find((v) => v._id === this.activeViewId);
      if (currentView && this.activeViewId !== "default") {
        this.applyView(currentView);
      } else {
        this.applyDefaultView();
      }
      this.setApplyingView(true, 2000);
    }
  }
}
