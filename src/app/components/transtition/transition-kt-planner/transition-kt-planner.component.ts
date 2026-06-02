import { Component, ElementRef, ViewChild, OnInit, Input, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { firstValueFrom } from 'rxjs';
import { TransitionService } from 'projects/crm-customer-portal-transition-ui/shared/transition/transition.service';
import { BBLoaderService, BbStoreService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { EventEmitter, Output } from '@angular/core';
import moment from 'moment';
import { DynamicHeightDirective } from '../../sharedUI/directives/dynamic-height.directive';
import { Dialog } from "primeng/dialog";
import { FileUpload, FileUploadModule } from "primeng/fileupload";
import { MastersService } from 'projects/customer-management-ui/shared/masters/masters.service';
import * as ExcelJS from 'exceljs';
import { SharepointService } from 'projects/customer-management-ui/shared/sharepoint/sharepoint.service';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { InputIconModule } from "primeng/inputicon";
import { IconFieldModule } from "primeng/iconfield";
import { ExcelService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service';
import { FloatLabelModule } from "primeng/floatlabel";
import { SelectModule } from 'primeng/select';
import { AutoScrollDirective } from '../../sharedUI/directives/auto-scroll.directive';
import * as XLSX from 'xlsx';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
@Component({
  selector: 'app-transition-kt-planner',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    Menu,
    IconFieldModule,
    InputTextModule,
    InputIconModule,
    TextareaModule,
    SelectModule,
    FormsModule,
    CommonModule,
    // AgGridDataTableComponent, 
    Dialog,
    DynamicHeightDirective,
    FileUploadModule,
    TableModule,
    DatePickerModule,
    PaginatorModule,
    Dialog,
    FileUpload,
    CheckboxModule,
    TooltipModule,
    FloatLabelModule,
    AutoScrollDirective,
  ],
  templateUrl: './transition-kt-planner.component.html',
  styleUrls: ['./transition-kt-planner.component.scss']
})
export class TransitionKtPlannerComponent implements OnInit {
  private transitionService = inject(TransitionService);
  private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private bbLoader = inject(BBLoaderService);
  private cdr = inject(ChangeDetectorRef);
  private masterService = inject(MastersService);
  private sharePoint = inject(SharepointService);
  private excelService = inject(ExcelService);

  @ViewChild('dt') dt!: Table;
  @ViewChild('exportSection') exportSection?: ElementRef;
  @ViewChild('tableMenu') tableMenu!: Menu;
  @ViewChild('excelMenu') excelMenu!: Menu;
  excelItems: MenuItem[] = [
    { label: "Export Excel", icon: "bi bi-filetype-exe text-2xl", command: () => this.onExport("EXCEL") },
    { label: "Export CSV", icon: "bi bi-filetype-csv text-2xl", command: () => this.onExport("CSV") },
    { label: "Export PDF", icon: "bi bi-filetype-pdf text-2xl", command: () => this.onExport("PDF") },
  ];

  tableItems: MenuItem[] = [
    { label: "Add Section", icon: "pi pi-folder", command: () => this.addSection() },
    { label: "Add Row", icon: "pi pi-plus", command: () => this.addRow() },
    { label: "Manage Columns", icon: "pi pi-sliders-h", command: () => this.openColumnManagement() },
  ];
  @Input() searchTerm: string = '';
  @Input() title: string = '';
  @Output() exportRequested = new EventEmitter<string>();

  users: any[] = [];
  uploadModal: boolean = false;
  replacConfirmeModal: boolean = false;
  selectedFile: File | null = null;
  uploadedFile: any = null;
  fileData: any = [];
  listItemsColumnData: any = [];
  cFilePathKtPlanner: any = null;
  cFileNameKtPlanner: any = null;
  showError: boolean = false;
  selectedRows: any[] = [];
  selectedSections: Set<any> = new Set();
  showDeleteConfirm: boolean = false;
  columnIndex: any;
  columnIndexName: any;
  showDeleteColumnConfirm: boolean = false;
  statusOptions = [
    { label: 'Yet to Start', value: 'Yet to Start' },
    { label: 'Not Yet Scheduled', value: 'Not Yet Scheduled' },
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Process Update', value: 'Process Update' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Open', value: 'Open' },
    { label: 'N/A', value: 'N/A' },
  ];

  riskLogStatusOptions = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' },
    { label: 'Critical', value: 'Critical' },
    { label: 'Open', value: 'Open' },
  ];

  columns: any[] = [];
  defaultColumns: any[] = [];

  rows: any[] = [];
  originalRows: any[] = [];

  first: number = 0;
  rowsPerPage: number = 50;
  totalRecords: number = 0;

  draggedColumn: any = null;
  dropPosition: string = '';
  userId: any;
  isModified: boolean = false;
  isExporting: boolean = false;
  defDateFormat: string = 'MM-DD-YYYY';
  defTimeZone: string = 'UTC';
  templateData: any = null;
  filesize: any = null;
  transitionId!: string;
  transitionData: any;

  showSectionDialog: boolean = false;
  editingSection: any = null;
  sectionName: string = '';
  dragOverRow: any = null;
  dragOverSection: any = null;
  draggedRow: any = null;
  // Add these properties
  showColumnDialog: boolean = false;
  transition_completed: boolean = false;
  editingColumnIndex: any = null;
  editingColumn: any = null;
  newOptionValue: string = '';
  columnOptionsMap: Map<string, any[]> = new Map(); // Store dropdown options per column

  columnTypeOptions: any = [
    { label: 'Input Text', value: 'input' },
    { label: 'Dropdown', value: 'dropdown' },
    { label: 'Date', value: 'date' }
  ];

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  async ngOnInit() {
    await this.loadDefaultColumns();
    this.userId = this.bbStore.getItem("userId");
    this.defTimeZone = this.bbStore.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.bbStore.getItem("dateFormatkey") || 'mm/dd/yyyy';
    this.transitionId = history.state._id;
    this.transitionData = history.state.data;
    this.transition_completed = history.state.transition_completed;

    try {
      this.bbLoader.showLoader();
      // await this.loadUsers();
      await this.loadFileConfig();
      if (this.transitionId) {
        await this.loadTemplateData();
      }
    } catch (error) {
      console.log('error: ', error);
    } finally {
      this.bbLoader.hideLoader()
    }
    await this.listenForUpdates();
    await this.initializeColumnOptions();
    this.columns = this.columns?.length > 0 ? this.columns : this.defaultColumns;
    console.log('this.columns: ', this.columns);

  }

  async loadDefaultColumns() {
    if (this.title === "kt-planner") {
      this.columns = [
        { field: 'Phase', header: 'Phase', type: 'input', isCustom: false },
        { field: 'Task', header: 'Task', type: 'input', isCustom: false },
        { field: 'ABG Assignee', header: 'ABG Assignee', type: 'input', isCustom: false },
        { field: 'Client Assignee', header: 'Client Assignee', type: 'input', isCustom: false },
        { field: 'KT Start Date', header: 'KT Start Date', type: 'date', isCustom: false },
        { field: 'KT End Date', header: 'KT End Date', type: 'date', isCustom: false },
        { field: 'KT Status', header: 'KT Status', type: 'dropdown', isCustom: false },
        { field: 'RKT Start Date', header: 'RKT Start Date', type: 'date', isCustom: false },
        { field: 'RKT End Date', header: 'RKT End Date', type: 'date', isCustom: false },
        { field: 'RKT Status', header: 'RKT Status', type: 'dropdown', isCustom: false },
        { field: 'Pilot Start Date', header: 'Pilot Start Date', type: 'date', isCustom: false },
        { field: 'Pilot End Date', header: 'Pilot End Date', type: 'date', isCustom: false },
        { field: 'Pilot Status', header: 'Pilot Status', type: 'dropdown', isCustom: false },
        { field: 'GO Live Date', header: 'GO Live Date', type: 'date', isCustom: false },
        { field: 'Final Status', header: 'Final Status', type: 'dropdown', isCustom: false },
      ]
    } else if (this.title === "action-tracker") {
      this.columns = [
        { field: 'Actions', header: 'Actions', type: 'input', isCustom: false },
        { field: 'Action Owner', header: 'Action Owner', type: 'input', isCustom: false },
        { field: 'Timeline', header: 'Timeline', type: 'input', isCustom: false },
        { field: 'Status', header: 'Status', type: 'dropdown', isCustom: false },
        { field: 'Comment', header: 'Comment', type: 'input', isCustom: false },
      ]
    } else if (this.title === "risk-logs") {
      this.columns = [
        { field: 'Risk ID', header: 'Risk ID', type: 'input', isCustom: false },
        { field: 'Client Name', header: 'Client Name', type: 'input', isCustom: false },
        { field: 'Workstream', header: 'Workstream', type: 'input', isCustom: false },
        { field: 'Risk Description', header: 'Risk Description', type: 'input', isCustom: false },
        { field: 'Problem', header: 'Problem', type: 'dropdown', isCustom: false },
        { field: 'Impact', header: 'Impact', type: 'dropdown', isCustom: false },
        { field: 'Rating', header: 'Rating', type: 'dropdown', isCustom: false },
        { field: 'Mitigation', header: 'Mitigation', type: 'input', isCustom: false },
        { field: 'Owner', header: 'Owner', type: 'input', isCustom: false },
        { field: 'Status', header: 'Status', type: 'dropdown', isCustom: false },
        { field: 'Remarks', header: 'Remarks', type: 'input', isCustom: false },
        { field: 'Deadline on', header: 'Deadline​', type: 'input', isCustom: false },
        { field: 'Actioned on', header: 'Date Completed​', type: 'input', isCustom: false },
      ]
    } else if (this.title === "matrix") {
      this.columns = [
        { field: "S.No", header: "S.No", type: "input", isCustom: false },
        { field: "First Name", header: "First Name", type: "input", isCustom: false },
        { field: "Last Name", header: "Last Name", type: "input", isCustom: false },
        { field: "Full Name", header: "Full Name", type: "input", isCustom: false },
        { field: "Mobile Number", header: "Mobile Number", type: "input", isCustom: false },
        { field: "Mobile Type (OS)", header: "Mobile Type (OS)", type: "input", isCustom: false },
        { field: "SPOC", header: "SPOC", type: "input", isCustom: false },
        { field: "Role", header: "Role", type: "input", isCustom: false },
        { field: "ABG Email ID", header: "ABG Email ID", type: "input", isCustom: false },
        { field: "JDE USER ID", header: "JDE USER ID", type: "input", isCustom: false },
        { field: "ERP JDE AR Profile", header: "ERP JDE AR Profile", type: "input", isCustom: false },
        { field: "Bank access (Wells Forgo)", header: "Bank access (Wells Forgo)", type: "input", isCustom: false },
        { field: "Remarks", header: "Remarks", type: "input", isCustom: false }
      ]
    }
    this.defaultColumns = this.columns;
  }

  async loadFileConfig() {
    try {
      const response = await firstValueFrom(this.masterService.getFileSizeConfig());
      this.filesize = response.data.attachmentSizeLimit || response;
    } catch (err: any) {
      console.log('err: ', err);
    }
  }

  async loadTemplateData() {
    try {
      const response = await firstValueFrom(
        this.transitionService.getByIdTemplateMapping(this.transitionId)
      );
      this.templateData = response?.data;
      this.loadSavedData();
    } catch (error) {
      console.error('Error loading template data:', error);
    } finally {
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchTerm']) {
      this.onSearchResult();
    }
  }

  async loadUsers(): Promise<void> {
    try {
      const usersResult = await firstValueFrom(this.transitionService.getEmpUserNames());
      const users = (Array.isArray(usersResult) ? usersResult : [])?.sort((a: any, b: any) =>
        a.empName?.localeCompare(b.empName)
      );

      this.users = users.map((val: any) => ({
        label: `${val?.empName} - ${val?.email}`,
        value: `${val?.empName} - ${val?.email}`,
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }

  async onSearchResult() {
    const term = this.searchTerm?.trim().toLowerCase();
    if (!term || term === '') {
      this.rows = [...this.originalRows];
      this.totalRecords = this.rows.length;
      return;
    }

    if (this.originalRows.length === 0) {
      this.originalRows = [...this.rows];
    }

    this.rows = this.originalRows.filter(row => {
      return this.columns.some(col => {
        const cellValue = row[col.field];
        if (cellValue !== null && cellValue !== undefined) {
          const stringValue = String(cellValue).toLowerCase();

          if (col.type === 'date' && cellValue) {
            try {
              const dateValue = new Date(cellValue);
              const formattedDate = moment(dateValue).format(this.defDateFormat).toLowerCase();
              return formattedDate.includes(term);
            } catch (e) {
              return false;
            }
          }

          return stringValue.includes(term);
        }
        return false;
      });
    });
    await this.updateRows();
    this.totalRecords = this.rows.length;
    this.first = 0;
    this.cdr.detectChanges();
  }

  async listenForUpdates() {
    this.transitionService.listen('template-updated').subscribe((data: any) => {
      if (this.transitionId === data?._id && data.type === this.title) {
        this.loadTemplateData();
      }
    });
  }

  async loadSavedData() {
    if (this.templateData?.ktPlanner && this.title === "kt-planner") {
      this.rows = this.templateData.ktPlanner.rows || [];
      this.originalRows = [...this.rows];
      // Use the fully-ordered saved columns directly (preserves drag-and-drop order)
      this.columns = this.templateData?.ktPlanner?.columns || this.columns;
      this.cFileNameKtPlanner = this.rows?.length > 0 && this.templateData?.ktPlanner?.cFileNameKtPlanner ? this.templateData?.ktPlanner?.cFileNameKtPlanner : null;
      this.cFilePathKtPlanner = this.rows?.length > 0 && this.templateData?.ktPlanner?.cFilePathKtPlanner ? this.templateData?.ktPlanner?.cFilePathKtPlanner : null;
    } else if (this.templateData?.actionTracker && this.title === "action-tracker") {
      this.rows = this.templateData.actionTracker.rows || [];
      this.originalRows = [...this.rows];
      // Use the fully-ordered saved columns directly (preserves drag-and-drop order)
      this.columns = this.templateData?.actionTracker?.columns || this.columns;
      this.cFileNameKtPlanner = this.rows?.length > 0 && this.templateData?.actionTracker?.cFileNameKtPlanner ? this.templateData?.actionTracker?.cFileNameKtPlanner : null;
      this.cFilePathKtPlanner = this.rows?.length > 0 && this.templateData?.actionTracker?.cFilePathKtPlanner ? this.templateData?.actionTracker?.cFilePathKtPlanner : null;
    } else if (this.templateData?.riskLogs && this.title === "risk-logs") {
      this.rows = this.templateData.riskLogs.rows || [];
      this.originalRows = [...this.rows];
      // Use the fully-ordered saved columns directly (preserves drag-and-drop order)
      this.columns = this.templateData?.riskLogs?.columns || this.columns;
      this.cFileNameKtPlanner = this.rows?.length > 0 && this.templateData?.riskLogs?.cFileNameKtPlanner ? this.templateData?.riskLogs?.cFileNameKtPlanner : null;
      this.cFilePathKtPlanner = this.rows?.length > 0 && this.templateData?.riskLogs?.cFilePathKtPlanner ? this.templateData?.riskLogs?.cFilePathKtPlanner : null;
    } else if (this.templateData?.riskLogs && this.title === "matrix") {
      this.rows = this.templateData.matrix.rows || [];
      this.originalRows = [...this.rows];
      // Use the fully-ordered saved columns directly (preserves drag-and-drop order)
      this.columns = this.templateData?.matrix?.columns || this.columns;
      this.cFileNameKtPlanner = this.rows?.length > 0 && this.templateData?.matrix?.cFileNameKtPlanner ? this.templateData?.matrix?.cFileNameKtPlanner : null;
      this.cFilePathKtPlanner = this.rows?.length > 0 && this.templateData?.matrix?.cFilePathKtPlanner ? this.templateData?.matrix?.cFilePathKtPlanner : null;
    }
    await this.updateRows();
    this.totalRecords = this.rows.length;
    this.cdr.detectChanges();
  }

  createEmptyRow() {
    let newRow: any = this.columns?.reduce((acc: any, col: any) => {

      // Set default value based on column type
      if (col.type === 'date') {
        acc[col.field] = null;
      } else {
        acc[col.field] = '';
      }

      return acc;

    }, {});

    // Add extra static field if needed
    newRow.isSection = false;

    this.columns.forEach(col => {
      if (col.isCustom && !newRow.hasOwnProperty(col.field)) {
        newRow[col.field] = '';
      }
    });
    newRow.id = this.rows?.length + 1;
    return newRow;
  }

  async addRow() {
    this.isModified = true;
    const newRow = this.createEmptyRow();
    this.rows = [...this.rows, newRow];
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.totalRecords = this.rows.length;
    this.saveChanges();
  }

  async addColumn() {
    this.isModified = true;
    const colIndex = this.columns.filter(col => col.isCustom).length + 1;
    const fieldName = `customCol${colIndex}`;

    const newColumn = {
      field: fieldName,
      header: `Custom Column ${colIndex}`,
      type: 'input',
      isCustom: true
    };

    this.columns = [...this.columns, newColumn];

    this.rows = this.rows.map(row => ({
      ...row,
      [fieldName]: ''
    }));
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.saveChanges();
  }

  async deleteRow(rowIndex: number) {
    this.isModified = true;
    this.rows = this.rows.filter((_, index) => index !== rowIndex);
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.totalRecords = this.rows.length;
    this.selectedRows = this.selectedRows.filter(row =>
      !this.rows.includes(row)
    );
    this.saveChanges();
  }

  async deleteColumn(columnIndex: number) {
    const columnToDelete = this.columns[columnIndex];

    if (columnToDelete.isCustom) {
      this.isModified = true;
      this.columns = this.columns.filter((_, index) => index !== columnIndex);

      this.rows = this.rows.map(row => {
        const { [columnToDelete.field]: removed, ...rest } = row;
        return rest;
      });
      await this.updateRows();

      this.originalRows = [...this.rows];
      this.saveChanges();
    }

    this.showDeleteColumnConfirm = false;
  }

  onHeaderDoubleClick(event: MouseEvent, column: any) {
    const headerElement = (event.target as HTMLElement).closest('th');

    if (headerElement && column) {
      const currentText = column.header;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.className = 'w-full h-full px-3 border border-blue-500 rounded text-black bg-white font-semibold';

      headerElement.innerHTML = '';
      headerElement.appendChild(input);
      input.focus();

      const finishEditing = () => {
        this.isModified = true;
        column.header = input.value.trim() || column.header;
        this.updateHeaderDisplay(headerElement, column);
        this.saveChanges();
      };

      input.addEventListener('blur', finishEditing);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finishEditing();
        if (e.key === 'Escape') this.updateHeaderDisplay(headerElement, column);
      });
    }
  }

  private updateHeaderDisplay(headerElement: Element, column: any) {
    headerElement.innerHTML = '';

    const headerContent = document.createElement('div');
    headerContent.className = 'flex items-center justify-between w-full h-full';

    const headerText = document.createElement('span');
    headerText.textContent = column.header;
    headerText.className = 'mr-4';

    headerContent.appendChild(headerText);

    if (column.isCustom) {
      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'pi pi-times text-red-500 hover:text-red-700 cursor-pointer text-xs ml-1';
      deleteIcon.onclick = () => {
        const columnIndex = this.columns.indexOf(column);
        if (columnIndex !== -1) {
          this.deleteColumn(columnIndex);
        }
      };
      headerContent.appendChild(deleteIcon);
    }

    const dragIcon = document.createElement('i');
    dragIcon.className = 'pi pi-bars text-gray-500 cursor-move text-xs ml-1';
    headerContent.appendChild(dragIcon);

    headerElement.appendChild(headerContent);
  }

  onPageChange(event: any) {
    this.first = event.first;
    this.rowsPerPage = event.rows;
  }

  getCurrentPageRows() {
    return this.rows.slice(this.first, this.first + this.rowsPerPage);
  }

  columnDragStart(event: any, column: any) {
    this.draggedColumn = column;
    event.dataTransfer.setData('text', column.field);
  }

  columnDragOver(event: any) {
    event.preventDefault();
    const target = event.target.closest('th');
    if (target) {
      const rect = target.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      this.dropPosition = event.clientX < midpoint ? 'left' : 'right';

      target.style.borderLeft = this.dropPosition === 'left' ? '2px solid #3b82f6' : 'none';
      target.style.borderRight = this.dropPosition === 'right' ? '2px solid #3b82f6' : 'none';
    }
  }

  columnDragLeave(event: any) {
    const target = event.target.closest('th');
    if (target) {
      target.style.borderLeft = 'none';
      target.style.borderRight = 'none';
    }
  }

  async columnDrop(event: any, dropColumn: any) {
    event.preventDefault();

    if (this.draggedColumn && this.draggedColumn !== dropColumn) {
      console.log("drop");
      this.isModified = true;
      const dragIndex = this.columns.indexOf(this.draggedColumn);
      const dropIndex = this.columns.indexOf(dropColumn);

      const removedColumn = this.columns.splice(dragIndex, 1)[0];
      const newIndex = this.dropPosition === 'left' ? dropIndex : dropIndex + 1;
      this.columns.splice(newIndex, 0, removedColumn);

      this.columns = [...this.columns];
      console.log('this.columns: ', this.columns);
      const rows = this.rows.map((row: any) => {
        if (row?.isSection) return row; // skip section rows if needed

        const newRow: any = {};

        this.columns.forEach((col: any) => {
          newRow[col.field] = row[col.field];
        });

        return newRow;
      });
      console.log('rows: ', rows);
      this.rows = rows;
      await this.updateRows();
      this.saveChanges();
    }

    const target = event.target.closest('th');
    if (target) {
      target.style.borderLeft = 'none';
      target.style.borderRight = 'none';
    }

    this.draggedColumn = null;
    this.dropPosition = '';
    this.bbToaster.show_success("Column layout saved successfully.")
  }

  onCellValueChange() {
    this.isModified = true;
    this.saveChanges();
    this.originalRows = [...this.rows];
  }

  onCelDateValueChange(selectedDate: Date) {
    if (!selectedDate) return;

    const day = new Date(selectedDate).getDay();

    if (day === 0 || day === 6) {
      this.bbToaster.show_info('You have selected a weekend.');
      return;
    }
  }

  private async saveChanges() {
    try {
      const customColumns = this.columns.filter(col => col.isCustom);
      const ktPlannerData = {
        rows: this.rows,
        customColumns: customColumns,
        cFilePathKtPlanner: this.cFilePathKtPlanner,
        cFileNameKtPlanner: this.cFileNameKtPlanner,
        columns: this.columns
      };

      const payload = {
        id: this.transitionId,
        type: this.title,
        updatedData: ktPlannerData,
        userId: this.userId,
        isModified: this.isModified
      };

      this.transitionService.emitData("updateTransitionTemplate", payload);
      this.isModified = false;
      this.totalRecords = this.rows.length;
    } catch (error) {
      console.error('Error saving KT Planner:', error);
    }
  }

  async getExportContext() {
    this.isExporting = true;
    const processedData = await this.processData();

    return {
      formData: processedData,
      filename: "Transition_KT_Planner",
      htmlSection: this.exportSection ?? null
    };
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return '';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';

      let format = this.defDateFormat || 'MM/DD/YYYY';

      if (format === 'mm/dd/yyyy') {
        return moment(date).format('MM/DD/YYYY');
      } else if (format === 'dd/mm/yyyy') {
        return moment(date).format('DD/MM/YYYY');
      } else if (format === 'yyyy/mm/dd') {
        return moment(date).format('YYYY/MM/DD');
      } else {
        return moment(date).format('MM/DD/YYYY');
      }
    } catch (e) {
      return '';
    }
  }

  async processData() {
    try {
      const headerRow: any = {};
      headerRow['Row Number'] = 'Row Number';
      this.columns.forEach(col => {
        headerRow[col.header] = col.header;
      });

      const processedData = this.rows.map((row, index) => {
        const obj: any = {};

        obj['Row Number'] = index + 1;

        this.columns.forEach(col => {
          const value = row[col.field];

          if (col.type === 'date') {
            if (value) {
              try {
                const dateValue = new Date(value);
                if (!isNaN(dateValue.getTime())) {
                  let formattedDate = '';

                  if (this.defDateFormat === 'mm/dd/yyyy') {
                    formattedDate = moment(dateValue).format('MM/DD/YYYY');
                  } else if (this.defDateFormat === 'dd/mm/yyyy') {
                    formattedDate = moment(dateValue).format('DD/MM/YYYY');
                  } else if (this.defDateFormat === 'yyyy/mm/dd') {
                    formattedDate = moment(dateValue).format('YYYY/MM/DD');
                  } else {
                    formattedDate = moment(dateValue).format('MM/DD/YYYY');
                  }

                  obj[col.header] = formattedDate;
                } else {
                  obj[col.header] = '';
                }
              } catch (e) {
                obj[col.header] = '';
              }
            } else {
              obj[col.header] = '';
            }
          } else {
            if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
              obj[col.header] = '';
            } else {
              obj[col.header] = value;
            }
          }
        });

        return obj;
      });

      let infoRow: any = {};

      if (this.templateData?.cCompanyName) {
        infoRow['Row Number'] = '';
        this.columns.forEach((col, idx) => {
          if (idx === 0) {
            infoRow[col.header] = `Company name: ${this.templateData?.cCompanyName || ""}`;
          } else if (idx === 1) {
            infoRow[col.header] = `Product name: ${this.templateData?.cProductName || ""}`;
          } else {
            infoRow[col.header] = '';
          }
        });
      } else if (this.templateData?.task_details) {
        infoRow['Row Number'] = '';
        this.columns.forEach((col, idx) => {
          if (idx === 0) {
            infoRow[col.header] = `Task name: ${this.templateData?.task_details?.cTaskName || ""}`;
          } else if (idx === 1) {
            infoRow[col.header] = `Description: ${this.templateData?.task_details?.cTaskDescription || ""}`;
          } else {
            infoRow[col.header] = '';
          }
        });
      }

      return infoRow['Row Number'] !== undefined ?
        [headerRow, infoRow, ...processedData] :
        [headerRow, ...processedData];

    } catch (error) {
      console.error('Error processing KT Planner data:', error);
      return [];
    } finally {
      this.isExporting = false;
    }
  }

  getDateFormat(): string {
    if (this.defDateFormat === 'mm/dd/yyyy') {
      return 'mm/dd/yy';
    } else if (this.defDateFormat === 'dd/mm/yyyy') {
      return 'dd/mm/yy';
    } else if (this.defDateFormat === 'yyyy/mm/dd') {
      return 'yy/mm/dd';
    } else {
      return 'mm/dd/yy';
    }
  }

  triggerExport(exportType: string) {
    this.exportRequested.emit(exportType);
  }

  openFileUploadModal() {
    this.uploadModal = true;
  }

  private parseCSV(text: string): any[] {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    const firstLine = lines[0];
    if (!firstLine) return [];

    const headers = firstLine.split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',');
      const row: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        row[header] = value === "" ? null : value;
      });

      return row;
    });
  }
  // =============================
  // FILE SELECT HANDLER
  // =============================
  async onFileSelect(event: any) {
    const file = event.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    // ===== FILE TYPE VALIDATION =====
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      this.bbToaster.show_error(
        "Only Excel (.xlsx, .xls) and CSV (.csv) files are allowed"
      );
      this.clearFileSelection();
      return;
    }

    // ===== FILE SIZE VALIDATION =====
    const maxSize = (this.filesize || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      this.bbToaster.show_error(
        `File size should not exceed ${this.filesize ?? 10} MB`
      );
      this.clearFileSelection();
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();

    reader.onload = async (e: any) => {
      try {

        let finalData: any[] = [];

        // ================= CSV =================
        if (fileExtension === 'csv') {

          const text = e.target.result as string;
          const parsed = this.parseCSV(text);

          if (!parsed.length) throw new Error("EMPTY_FILE");

          const headers = Object.keys(parsed[0] || {});
          if (!headers.length || headers.every(h => !h.trim())) {
            throw new Error("INVALID_HEADER");
          }

          finalData = parsed;
        }

        // ================= XLS =================
        else if (fileExtension === 'xls') {

          const buffer = e.target.result as ArrayBuffer;
          const data = new Uint8Array(buffer);

          let workbook;
          try {
            workbook = XLSX.read(data, {
              type: 'array',
              cellFormula: true,
              cellDates: true
            });
          } catch {
            throw new Error("ENCRYPTED_FILE");
          }

          const sheetName = workbook.SheetNames[0];
          if (!sheetName) throw new Error("EMPTY_FILE");
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) throw new Error("EMPTY_FILE");

          for (const cellAddress in worksheet) {
            if (cellAddress[0] === '!') continue;
            const cell = worksheet[cellAddress];
            if (cell?.f) throw new Error("FORMULA_NOT_ALLOWED");
          }

          const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
            raw: true
          });

          if (!rawData.length) throw new Error("EMPTY_FILE");

          // Trim spaces from header keys for XLS
          finalData = rawData.map((row: any) => {
            const trimmedRow: any = {};
            Object.keys(row).forEach(key => {
              trimmedRow[key.trim()] = row[key];
            });
            return trimmedRow;
          });
        }

        // ================= XLSX =================
        else {

          const buffer = e.target.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();

          try {
            await workbook.xlsx.load(buffer);
          } catch {
            throw new Error("ENCRYPTED_FILE");
          }

          const worksheet = workbook.worksheets[0];
          if (!worksheet || worksheet.rowCount <= 1) {
            throw new Error("EMPTY_FILE");
          }

          const headerRow = worksheet.getRow(1);
          const headers: string[] = [];
          let hasFormula = false;

          headerRow.eachCell((cell, colNumber) => {
            if (cell.formula) hasFormula = true;
            headers[colNumber - 1] = String(cell.value ?? '').trim();
          });

          if (hasFormula) throw new Error("FORMULA_NOT_ALLOWED");
          if (!headers.length || headers.every(h => !h)) {
            throw new Error("INVALID_HEADER");
          }

          for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const obj: any = {};

            for (let j = 1; j <= headers.length; j++) {
              const cell = row.getCell(j);

              if (cell.formula) {
                throw new Error("FORMULA_NOT_ALLOWED");
              }

              const headerName = headers[j - 1];
              if (headerName !== undefined) {
                obj[headerName] = cell.value ?? null;
              }
            }

            const isEmptyRow = Object.values(obj).every(
              v => v === null || String(v).trim() === ''
            );

            if (!isEmptyRow) finalData.push(obj);
          }

          if (!finalData.length) throw new Error("EMPTY_FILE");
        }

        // ================= UNIFIED NORMALIZATION =================
        const formattedData = finalData.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(key => {
            // Trim key (header name) to remove any leading/trailing spaces
            newRow[key.trim()] = this.normalizeCellValue(row[key]);
          });
          return newRow;
        });
        const isSame =
          JSON.stringify(this.normalizeRowsForCompare(this.rows) || []) ===
          JSON.stringify(this.normalizeRowsForCompare(formattedData) || []);

        if (isSame) {
          this.bbToaster.show_error(
            `No new changes found. ${this.title === 'kt-planner'
              ? 'Transition planner'
              : this.title === 'action-tracker'
                ? 'Action tracker'
                : 'Risk logs'
            } is already up to date.`
          );
          this.clearFileSelection();
          return;
        }
        const matchedColumns = this.title === "risk-logs"
          ? ['Problem', 'Impact', 'Rating', 'Status']
          : ['KT Status', 'RKT Status', 'Pilot Status', "Final Status", 'Go Live', 'Status'];

        const options = this.title === "risk-logs"
          ? this.riskLogStatusOptions
          : this.statusOptions;

        const columns = this.defaultColumns
          ?.filter((val: any) => matchedColumns.includes(val.field))
          ?.map((val: any) => val.field);

        let columnNames = new Set<string>();
        let columnValue = new Set<string>();
        let rowNumber = new Set<number>();

        formattedData?.forEach((row: any, index: number) => {

          const values = Object.values(row);

          // Skip row if all values are the same (section row where every cell repeats the section name)
          const allSame = values.every(v => v === values[0]);
          if (allSame) return;

          // Skip section rows where only one cell has a meaningful value (XLS: section name in col A, rest null/empty)
          const meaningfulValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
          if (meaningfulValues.length <= 1) return;

          // Normalize a value for comparison: lowercase + replace hyphens/underscores with space + trim
          const normalizeVal = (v: string) => v.toLowerCase().replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

          Object.keys(row).forEach((key) => {
            const value = row[key];

            if (
              columns?.includes(key) &&
              value &&
              !options?.map((o: any) => normalizeVal(o.value)).includes(normalizeVal(String(value)))
            ) {
              columnNames.add(key);
              columnValue.add(value);
              rowNumber.add(index + 1);
            }
          });
        });
        if (columnNames.size > 0) {
          this.bbToaster.show_warn(
            `Invalid value "${[...columnNames].join(", ")}" in ${[...columnValue].join(", ")} at row ${[...rowNumber].join(", ")}. Allowed values are: ${options?.map((val: any) => val.label).join(", ")}`
          );
          this.clearFileSelection();
          return;
        }
        this.fileData = formattedData;

      } catch (error: any) {

        switch (error.message) {
          case "ENCRYPTED_FILE":
            this.bbToaster.show_error(
              "Password-protected or encrypted files are not supported."
            );
            break;

          case "FORMULA_NOT_ALLOWED":
            this.bbToaster.show_error(
              "Formulas are not supported. Please upload static values only."
            );
            break;

          case "INVALID_HEADER":
            this.bbToaster.show_error(
              "Please ensure the first row contains valid headers."
            );
            break;

          case "EMPTY_FILE":
            this.bbToaster.show_error(
              "The uploaded file is empty."
            );
            break;

          default:
            this.bbToaster.show_error(
              "Unable to import file. Please check the file and retry."
            );
            break;
        }

        this.clearFileSelection();
      }
    };

    if (fileExtension === 'csv') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  private normalizeRowsForCompare(data: any[]): any[] {
    return data
      .map(row => {
        const { id, isSection, sectionId, ...rest } = row;

        const keys = Object.keys(rest).filter(key => key && key.trim() !== '');

        if (!keys.length) return null;

        const values = keys.map(key =>
          this.normalizeCellValue(rest[key])
        ).filter(value =>
          value !== null && value !== undefined && value !== ''
        );

        if (!values.length) return null;

        const normalized: any = {};

        // ✅ Check if all values are same
        const allSame = values.every(val => val === values[0]);

        if (allSame) {
          return {
            section: values[0],          // first value
            sectionName: keys[0]         // first key name
          };
        }

        // ✅ Normal row handling
        keys.forEach(key => {
          const value = this.normalizeCellValue(rest[key]);

          if (value !== null && value !== undefined && value !== '') {
            normalized[key] = value;
          }
        });

        return Object.keys(normalized).length > 0 ? normalized : null;
      })
      .filter(row => row !== null);
  }

  private normalizeCellValue(value: any): any {
    if (value === null || value === undefined) return null;

    // ExcelJS Date object (XLSX)
    if (value instanceof Date) {
      return moment(value).format(this.defDateFormat.toUpperCase());
    }

    // Excel serial number (XLS)
    if (typeof value === 'number' && value > 25569) {
      const excelDate = new Date((value - 25569) * 86400 * 1000);
      return moment(excelDate).format(this.defDateFormat.toUpperCase());
    }

    // String dates (CSV or text Excel)
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const parsedDate = moment(trimmed, [
        moment.ISO_8601,
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'DD-MM-YYYY',
        'MM-DD-YYYY',
        'YYYY-MM-DD',
        'YYYY/MM/DD',
        'DD/MM/YY',
        'MM/DD/YY',
        'DD-MM-YY',
        'MM-DD-YY',
        'DD MMM YYYY',
        'MMM DD YYYY'
      ], true);

      if (parsedDate.isValid()) {
        return parsedDate.format(this.defDateFormat.toUpperCase());
      }

      return trimmed;
    }

    return value;
  }

  async uploadFile() {
    if (!this.selectedFile || !this.fileData?.length) return;
    try {
      this.bbLoader.showLoader();
      this.replacConfirmeModal = false;
      this.isModified = true;
      this.uploadedFile = this.selectedFile;
      const formData = new FormData();
      const originalName = this.selectedFile?.name || '';
      const extension = originalName.split('.').pop();
      const baseName = originalName.replace(/\.[^/.]+$/, '');

      const cleanBaseName = baseName
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[<>:"/\\|?*]+/g, '');

      const fileName = `${cleanBaseName}.${extension}`;
      const AccountName = this.transitionData.AccountName
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[<>:"/\\|?*]/g, "")
        .substring(0, 50);

      const filePath = `transition/${AccountName}/${this.transitionData?.transitionNo}`;

      formData.append("file", this.uploadedFile);
      formData.append("path", filePath);
      formData.append("fileName", this.selectedFile?.name);
      formData.append("companyId", this.bbStore.getItem("selectedCompanyId"));

      const uploadResponse: any = await this.sharePoint.uploadFileToStorage(formData).toPromise();
      if (uploadResponse) {
        this.bbToaster.show_success("File uploaded successfully");
      }
      this.columns = [];
      this.rows = [];
      this.cFileNameKtPlanner = fileName;
      this.cFilePathKtPlanner = uploadResponse?.path;

      // Process file data with formula handling
      await this.processRegularData();

      this.uploadModal = false;
      this.resetFileSelection();
      await this.initializeColumnOptions();
      this.updateRows();
    } catch (error) {
      console.log('error: ', error);
      this.bbToaster.show_error("File upload failed.");
    } finally {
      await this.saveChanges();
      this.bbLoader.hideLoader();
    }
  }

  // New method to process file data with formula handling
  async processFileDataWithFormulas() {
    const fileExtension = this.selectedFile?.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'xlsx') {
      // For XLSX files, use ExcelJS with formula handling
      await this.processExcelWithFormulas();
    } else if (fileExtension === 'xls') {
      // For XLS files, use XLSX package with formula handling
      await this.processXLSWithFormulas();
    } else {
      // For CSV files, use existing logic
      this.processRegularData();
    }
  }

  // New method to process XLS files with formulas using XLSX
  async processXLSWithFormulas() {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (e: any) => {
        try {
          const buffer = e.target.result as ArrayBuffer;
          const data = new Uint8Array(buffer);

          const workbook = XLSX.read(data, {
            type: 'array',
            cellFormula: true,
            cellDates: true,
            cellNF: false,
            sheetStubs: true
          });

          const sheetName = workbook.SheetNames[0];
          if (!sheetName) throw new Error("EMPTY_FILE");
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) throw new Error("EMPTY_FILE");

          // Get the data as array of arrays to handle formulas properly
          const rawData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '',
            raw: false
          });

          if (rawData.length === 0) {
            resolve(true);
            return;
          }

          // First row is headers
          const headers = (rawData[0] as any[]).map(h => String(h || '').trim()).filter(h => h !== '');

          // Create columns based on headers
          headers.forEach((header) => {
            const existingColumn = this.columns?.find(
              (c: any) => c.header?.toLowerCase() === header.toLowerCase()
            );

            if (!existingColumn) {
              // const defaultexistingColumn = this.defaultColumns?.find(
              //   (c: any) => c.header?.toLowerCase() === header.toLowerCase()
              // );
              const fieldName = header.toLowerCase().replace(/\s+/g, '_');
              const column = this.getFieldTypeFromHeader(header);

              this.columns.push({
                field: fieldName,
                header: header,
                type: column ? column.type : 'input',
                isCustom: column ? false : true
              });
            }
          });

          // Process data rows (skip header row)
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i] as any[];
            const rowObject: any = {};
            let isEmptyRow = true;

            headers.forEach((header, index) => {
              let cellValue = row[index];
              const fieldName = this.getFieldNameFromHeader(header);

              // Handle formula results if cell is an object with result property
              if (cellValue && typeof cellValue === 'object') {
                if (cellValue.result !== undefined) {
                  cellValue = cellValue.result;
                } else if (cellValue.text !== undefined) {
                  cellValue = cellValue.text;
                } else {
                  cellValue = '';
                }
              }

              // Handle date values
              if (this.isValidDate(cellValue)) {
                const column = this.columns.find(c => c.header === header);
                if (column) {
                  column.type = "date";
                }
                rowObject[fieldName] = cellValue ? moment(cellValue).toDate() : null;
              } else {
                rowObject[fieldName] = cellValue !== "" ? cellValue : row[0];
              }

              if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
                isEmptyRow = false;
              }
            });

            // Check if this is a section row
            const values = Object.values(rowObject);
            const firstValue = values[0];
            const isSectionRow = values.length > 0 && values.every(v => v === firstValue);

            if (isSectionRow && firstValue) {
              const sectionValue = firstValue || '';
              const newSection: any = this.columns?.reduce((acc: any, col: any) => {
                acc[col.field] = col.type === 'date' ? null : '';
                return acc;
              }, {});

              newSection.isSection = true;
              newSection.sectionId = sectionValue;
              newSection.Section = sectionValue;
              newSection.sectionName = sectionValue;

              this.rows.push(newSection);
            } else if (!isEmptyRow) {
              rowObject.isSection = false;
              this.rows.push(rowObject);
            }
          }

          resolve(true);
        } catch (error) {
          console.error('Error processing XLS with formulas:', error);
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(this.selectedFile!);
    });
  }

  // Update existing processExcelWithFormulas method for XLSX files
  async processExcelWithFormulas() {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async (e: any) => {
        try {
          const buffer = e.target.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);

          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            return;
          }

          // Get headers from first row
          const headers: string[] = [];
          worksheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value ?? '').trim();
          });

          // Create columns based on headers
          headers.forEach((header) => {
            const existingColumn = this.columns?.find(
              (c: any) => c.header?.toLowerCase() === header.toLowerCase()
            );

            if (!existingColumn) {
              // const defaultexistingColumn = this.defaultColumns?.find(
              //   (c: any) => c.header?.toLowerCase() === header.toLowerCase()
              // );
              const fieldName = header.toLowerCase().replace(/\s+/g, '_');
              const column = this.getFieldTypeFromHeader(header);

              this.columns.push({
                field: fieldName,
                header: header,
                type: column ? column.type : 'input',
                isCustom: column ? false : true
              });
            }
          });

          // Process each data row (starting from row 2)
          worksheet?.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row

            const rowObject: any = {};
            let isEmptyRow = true;

            headers.forEach((header, index) => {
              const cell = row.getCell(index + 1);
              let cellValue: any = cell.value;
              const fieldName = this.getFieldNameFromHeader(header);

              // Handle formula cells - get the calculated value
              if (cell.formula) {
                cellValue = cell.result !== undefined ? cell.result : cell.value;
              }

              // Handle different value types
              if (cellValue !== null && cellValue !== undefined) {
                if (typeof cellValue === 'object' && 'text' in cellValue) {
                  cellValue = cellValue.text || '';
                }

                // Check if it's a date
                if (this.isValidDate(cellValue)) {
                  const column = this.columns.find(c => c.header === header);
                  if (column) {
                    column.type = "date";
                  }
                  rowObject[fieldName] = moment(cellValue).toDate();
                } else {
                  rowObject[fieldName] = cellValue;
                }

                if (cellValue !== '') {
                  isEmptyRow = false;
                }
              } else {
                rowObject[fieldName] = '';
              }
            });

            // Check if this is a section row
            const values = Object.values(rowObject);
            const firstValue = values[0];
            const isSectionRow = values.length > 0 && values.every(v => v === firstValue);

            if (isSectionRow && firstValue) {
              const sectionValue = firstValue || '';
              const newSection: any = this.columns?.reduce((acc: any, col: any) => {
                acc[col.field] = col.type === 'date' ? null : '';
                return acc;
              }, {});

              newSection.isSection = true;
              newSection.sectionId = sectionValue;
              newSection.Section = sectionValue;
              newSection.sectionName = sectionValue;

              this.rows.push(newSection);
            } else if (!isEmptyRow) {
              rowObject.isSection = false;
              this.rows.push(rowObject);
            }
          });

          resolve(true);
        } catch (error) {
          console.error('Error processing Excel with formulas:', error);
          reject(error);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(this.selectedFile!);
    });
  }

  // private formatCellValue(value: any): any {

  //   if (!value) return value;

  //   // If already Date object
  //   if (value instanceof Date) {
  //     return moment(value).format(this.defDateFormat.toUpperCase());
  //   }

  //   // If ExcelJS rich object with result (formula evaluated)
  //   if (value?.result instanceof Date) {
  //     return moment(value.result).format(this.defDateFormat.toUpperCase());
  //   }

  //   // If numeric Excel serial date (XLS case)
  //   if (typeof value === 'number' && value > 25569) {
  //     const excelDate = new Date((value - 25569) * 86400 * 1000);
  //     return moment(excelDate).format(this.defDateFormat.toUpperCase());
  //   }

  //   return value;
  // }

  // Helper method to process regular data (imported fileData)
  async processRegularData() {
    // --- Step 1: Build a header→defaultColumn map (case-insensitive) ---
    // Scan ALL rows to collect the full header set (first row may be a section row with only 1 key)
    const excelHeaders: string[] = [];
    if (this.fileData?.length) {
      this.fileData.forEach((row: any) => {
        Object.keys(row).forEach(key => {
          if (!excelHeaders.includes(key)) excelHeaders.push(key);
        });
      });
    }

    // Map each Excel header to a defaultColumn (by header name, case-insensitive)
    // or create a custom column if no match found
    const headerToColumnMap: Map<string, any> = new Map();
    excelHeaders.forEach(excelHeader => {
      const matchedDefault = this.defaultColumns?.find(
        (c: any) => c.header?.toLowerCase().trim() === excelHeader?.toLowerCase().trim()
      );
      if (matchedDefault) {
        headerToColumnMap.set(excelHeader, matchedDefault);
      } else {
        // Check if already added as custom
        const existingCustom = this.columns?.find(
          (c: any) => c.header?.toLowerCase().trim() === excelHeader?.toLowerCase().trim()
        );
        if (!existingCustom) {
          headerToColumnMap.set(excelHeader, {
            field: excelHeader,
            header: excelHeader,
            type: 'input',
            isCustom: true
          });
        } else {
          headerToColumnMap.set(excelHeader, existingCustom);
        }
      }
    });

    // --- Step 2: Rebuild this.columns in defaultColumns order, then custom columns ---
    const matchedDefaultCols: any[] = [];
    const customCols: any[] = [];

    this.defaultColumns?.forEach((defCol: any) => {
      // Check if this defaultColumn was present in the Excel file
      const isPresent = excelHeaders.some(
        h => h?.toLowerCase().trim() === defCol.header?.toLowerCase().trim()
      );
      if (isPresent) {
        matchedDefaultCols.push(defCol);
      }
    });

    headerToColumnMap.forEach((col) => {
      if (col.isCustom) {
        customCols.push(col);
      }
    });

    this.columns = [...matchedDefaultCols, ...customCols];

    // --- Step 3: Process each row, mapping keys to correct field names & reorder ---
    this.fileData?.forEach((val: any) => {
      const values = Object.values(val || {});
      const firstValue = values[0];

      // Section row detection:
      // (a) All values are the same (e.g. exported section rows)
      const allSame = values.length > 0 && values.every(v => v === firstValue);
      // (b) Only one meaningful (non-null/non-empty) value — XLS sparse section rows
      const meaningfulValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');
      const isSectionRow = (allSame && !!firstValue) || (meaningfulValues.length === 1);

      if (isSectionRow) {
        const sectionValue = meaningfulValues[0] ?? firstValue;
        const newSection: any = this.columns?.reduce((acc: any, col: any) => {
          acc[col.field] = col.type === 'date' ? null : '';
          return acc;
        }, {});
        newSection.isSection = true;
        newSection.sectionId = sectionValue;
        newSection.Section = sectionValue;
        newSection.sectionName = sectionValue;
        this.rows.push(newSection);
        return;
      }

      // Build row in column order
      const newRow: any = {};
      this.columns.forEach((col: any) => {
        // Find the Excel header that maps to this column
        let excelKey: string | undefined;
        headerToColumnMap.forEach((mappedCol, hdr) => {
          if (mappedCol.field === col.field) excelKey = hdr;
        });
        const value = excelKey !== undefined ? val[excelKey] : undefined;

        if (value !== undefined && value !== null) {
          if (this.isValidDate(value)) {
            col.type = 'date';
            newRow[col.field] = moment(value).format(this.defDateFormat.toUpperCase());
          } else {
            newRow[col.field] = value;
          }
        } else {
          newRow[col.field] = col.type === 'date' ? null : '';
        }
      });

      newRow.isSection = false;
      this.rows.push(newRow);
    });
  }

  // Helper method to get field name from header
  getFieldNameFromHeader(header: string): string {
    const column = this.columns.find(c => c.header === header);
    return column ? column.field : header;
  }
  getFieldTypeFromHeader(header: string): any {
    const column = this.defaultColumns.find(c => c.header === header);
    return column;
  }

  isValidDate(value: any): boolean {
    if (!value) return false;

    return moment(
      value,
      [
        moment.ISO_8601,
        "DD/MM/YYYY",
        "MM/DD/YYYY",
        "YYYY-MM-DD",
        "DD-MM-YYYY" // ✅ Added this
      ],
      true
    ).isValid();
  }

  cancelUpload() {
    this.uploadModal = false;
    this.resetFileSelection();
  }

  resetFileSelection() {
    this.selectedFile = null;
    this.uploadedFile = null;
    this.fileData = [];
    this.listItemsColumnData = [];
  }

  clearFileSelection() {
    this.resetFileSelection();
  }

  async removeSelectedFile() {
    this.cFileNameKtPlanner = null;
    this.cFilePathKtPlanner = null;
    this.resetFileSelection();
  }

  async downloadFile() {
    if (this.selectedFile) {
      this.sharePoint.downloadFile(this.selectedFile, `${this.cFilePathKtPlanner}`);
    } else {
      const downloadRequest = {
        filePath: `${this.cFilePathKtPlanner}`,
        companyId: this.bbStore.getItem("selectedCompanyId"),
      };
      const fileBlob = await this.sharePoint.getFileFromDownloadStorage(downloadRequest).toPromise();

      if (!fileBlob) {
        this.bbToaster.show_error("Unable to download file");
        return;
      }

      this.sharePoint.downloadFile(fileBlob, `${this.cFileNameKtPlanner}`);
    }
  }

  toggleRowSelection(row: any, event: any) {
    if (event.checked) {
      this.selectedRows.push(row);
    } else {
      const index = this.selectedRows.findIndex(r =>
        JSON.stringify(r) === JSON.stringify(row)
      );
      if (index !== -1) {
        this.selectedRows.splice(index, 1);
      }
    }
  }

  isRowSelected(row: any): boolean {
    return this.selectedRows.some(r =>
      r.id === row.id
    );
  }

  toggleAllRows(event: any) {
    const currentPageRows = this.getCurrentPageRows();
    console.log('currentPageRows: ', currentPageRows);

    if (event.checked) {
      currentPageRows.forEach(row => {
        if (row.isSection) {
          this.selectedSections.add(row);
          const childRows = this.getChildRows(row);
          childRows.forEach(childRow => {
            if (!this.isRowSelected(childRow)) {
              this.selectedRows.push(childRow);
            }
          });
        } else if (!this.isRowSelected(row)) {
          this.selectedRows.push(row);
        }
      });
    } else {
      this.selectedSections.clear();
      this.selectedRows = [];
    }
  }

  isAllRowsSelected(): boolean {
    const currentPageRows = this.getCurrentPageRows();
    if (currentPageRows.length === 0) return false;

    return currentPageRows.every(row => {
      if (row.isSection) {
        return this.isSectionSelected(row);
      } else {
        return this.isRowSelected(row);
      }
    });
  }

  async deleteSelectedRows() {
    if (this.selectedRows.length === 0 && this.selectedSections.size === 0) {
      this.showDeleteConfirm = false;
      return;
    }

    this.isModified = true;

    const sectionsToDelete = Array.from(this.selectedSections);
    sectionsToDelete.forEach(section => {
      const sectionIndex = this.rows.indexOf(section);
      if (sectionIndex !== -1) {
        this.rows.splice(sectionIndex, 1);
        this.rows = this.rows.filter(row => row.sectionId !== section.sectionId);
      }
    });

    const selectedRowStrings = this.selectedRows.map(r => JSON.stringify(r));
    this.rows = this.rows.filter(row =>
      !selectedRowStrings.includes(JSON.stringify(row))
    );
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.totalRecords = this.rows.length;

    const totalCount = (this.selectedRows?.length || 0) + (this.selectedSections?.size || 0);
    this.bbToaster.show_success(
      `Selected ${totalCount} question(s) deleted successfully`
    );

    this.selectedRows = [];
    this.selectedSections.clear();
    this.showDeleteConfirm = false;
    this.saveChanges();

    if (this.rows?.length === 0) {
      this.removeSelectedFile();
    }
  }

  addSection() {
    this.showError = false;
    this.showSectionDialog = true;
    this.editingSection = null;
    this.sectionName = '';
  }

  getChildRows(section: any): any[] {
    if (!section || !section.sectionId) return [];
    return this.rows.filter(row => !row.isSection && row.sectionId === section.sectionId);
  }

  editSection(section: any) {
    if (!this.canSelect()) {
      return;
    }
    this.showError = false;
    this.editingSection = section;
    this.sectionName = section.sectionName;
    this.showSectionDialog = true;
  }

  async deleteSection(section: any) {
    this.isModified = true;

    const sectionIndex = this.rows.findIndex(row => row === section);
    if (sectionIndex !== -1) {
      this.rows.splice(sectionIndex, 1);
      this.rows = this.rows.filter(row => row.sectionId !== section.sectionId);
    }

    this.selectedSections.delete(section);

    const childRows = this.getChildRows(section);
    const childRowStrings = childRows.map(r => JSON.stringify(r));
    this.selectedRows = this.selectedRows.filter(row =>
      !childRowStrings.includes(JSON.stringify(row))
    );
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.totalRecords = this.rows.length;
    this.saveChanges();
    this.cdr.detectChanges();

    this.bbToaster.show_success('Section deleted successfully');
  }

  async addRowInSection(section: any) {
    this.isModified = true;
    const newRow = this.createEmptyRow();
    newRow.sectionId = section.sectionId;
    newRow.sectionName = section.sectionName;

    const sectionIndex = this.rows.findIndex(row => row === section);
    this.rows.splice(sectionIndex + 1, 0, newRow);
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.totalRecords = this.rows.length;
    this.saveChanges();
    this.cdr.detectChanges();
  }

  // isSectionExpanded(sectionId: string): boolean {
  //   return true;
  // }

  rowDragStart(event: any, row: any) {
    this.draggedRow = row;
    event.dataTransfer.setData('text/plain', JSON.stringify({
      isSection: row.isSection || false,
      sectionId: row.sectionId,
      id: row.id
    }));
    // event.target.classList.add('opacity-50');
  }

  rowDragOver(event: any) {
    event.preventDefault();
    const target = event.target.closest('tr');
    if (!target) return;

    const rowData = this.rows.find(r => {
      if (r.isSection) {
        return target.hasAttribute('data-row-id') && target.getAttribute('data-row-id') === r.sectionId;
      }
      return false;
    });

    if (rowData?.isSection) {
      this.dragOverSection = rowData;
      target.style.borderTop = '2px solid #3b82f6';
      target.style.borderBottom = '2px solid #3b82f6';
    } else {
      const rect = target.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (event.clientY < midpoint) {
        target.style.borderTop = '2px solid #3b82f6';
        target.style.borderBottom = 'none';
      } else {
        target.style.borderTop = 'none';
        target.style.borderBottom = '2px solid #3b82f6';
      }
    }
  }

  async rowDrop(event: any, dropRow: any) {
    event.preventDefault();

    const target = event.target.closest('tr');
    if (target) {
      target.style.borderTop = 'none';
      target.style.borderBottom = 'none';
    }

    if (!this.draggedRow || this.draggedRow === dropRow) {
      this.draggedRow = null;
      return;
    }

    this.isModified = true;

    const dragIndex = this.rows.indexOf(this.draggedRow);
    // const dropIndex = this.rows.indexOf(dropRow);

    const rect = target?.getBoundingClientRect();
    const midpoint = rect ? rect.top + rect.height / 2 : 0;
    const dropPosition = event.clientY < midpoint ? 'above' : 'below';

    this.rows.splice(dragIndex, 1);

    const newDropIndex = this.rows.indexOf(dropRow);

    if (dropPosition === 'above') {
      this.rows.splice(newDropIndex, 0, this.draggedRow);
    } else {
      this.rows.splice(newDropIndex + 1, 0, this.draggedRow);
    }

    if (this.draggedRow.isSection) {
      const childRows = this.getChildRows(this.draggedRow);
      childRows.forEach(child => {
        child.sectionId = this.draggedRow.sectionId;
      });
    }

    this.rows = [...this.rows];
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.saveChanges();
    this.cdr.detectChanges();

    this.draggedRow = null;
    this.dragOverRow = null;
    this.dragOverSection = null;
    this.bbToaster.show_success("Question order updated successfully.")
  }

  rowDragLeave(event: any) {
    const target = event.target.closest('tr');
    if (target) {
      target.style.borderTop = 'none';
      target.style.borderBottom = 'none';
    }
    this.dragOverRow = null;
    this.dragOverSection = null;
  }

  getDisplayRowNumber(row: any): number {
    let count = 1;
    for (let r of this.getCurrentPageRows()) {
      if (r.isSection) continue;
      if (r === row) return count;
      count++;
    }
    return count;
  }

  async saveSection() {
    if (!this.sectionName?.trim()) {
      this.showError = true;
      this.bbToaster.show_warn('Please enter a section name');
      return;
    }

    this.isModified = true;

    if (this.editingSection) {
      this.editingSection.sectionName = this.sectionName;
      this.editingSection.Section = this.sectionName;
    } else {
      const sectionId = 'section_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      let newSection: any = this.columns?.reduce((acc: any, col: any) => {

        // Set default value based on column type
        if (col.type === 'date') {
          acc[col.field] = null;
        } else {
          acc[col.field] = '';
        }

        return acc;

      }, {});

      // Add extra static field if needed
      newSection.isSection = true;
      newSection.sectionId = sectionId;
      newSection.Section = this.sectionName;
      newSection.sectionName = this.sectionName;

      this.columns.forEach(col => {
        if (col.isCustom && !newSection.hasOwnProperty(col.field)) {
          newSection[col.field] = '';
        }
      });

      if (this.selectedRows.length > 0) {
        const lastSelectedIndex = Math.max(...this.selectedRows.map(r => this.rows.indexOf(r)));
        this.rows.splice(lastSelectedIndex + 1, 0, newSection);
      } else {
        this.rows = [...this.rows, newSection];
      }
    }
    await this.updateRows();
    this.originalRows = [...this.rows];
    this.totalRecords = this.rows.length;
    this.showSectionDialog = false;
    this.editingSection = null;
    this.sectionName = '';
    this.saveChanges();
    this.cdr.detectChanges();
  }

  cancelSection() {
    this.showSectionDialog = false;
    this.editingSection = null;
    this.sectionName = '';
    this.showError = false;
  }

  toggleSectionSelection(section: any, event: any) {
    const childRows = this.getChildRows(section);
    if (event.checked) {
      this.selectedSections.add(section);
      childRows.forEach(row => {
        if (!this.isRowSelected(row)) {
          this.selectedRows.push(row);
        }
      });
    } else {
      this.selectedSections.delete(section);
      const childRowStrings = childRows.map(r => JSON.stringify(r));
      this.selectedRows = this.selectedRows.filter(row =>
        !childRowStrings.includes(JSON.stringify(row))
      );
    }
  }

  isSectionSelected(section: any): boolean {
    return this.selectedSections.has(section);
  }

  async onExport(exportType: string) {

    const processedData: any[] = [];
    let serialNumber = 1;

    this.rows.forEach((row: any) => {

      const newRow: any = {};
      if (this.title !== "matrix") {
        // ✅ Always add S.NO column first
        if (row.isSection) {
          newRow["#"] = "";
        } else {
          newRow["#"] = serialNumber++;
        }
      }

      if (row.isSection) {

        // Section Row
        this.columns.forEach((col: any, index: number) => {
          if (index === 0) {
            newRow[col.header] = row.Section;
          } else {
            newRow[col.header] = "";
          }
        });

      } else {

        // ✅ Normal Row
        this.columns.forEach((col: any) => {

          let value = row[col.field];

          // 🔥 Format Date Values
          if (value && this.isValidDate(value)) {
            value = moment(value).format(this.defDateFormat.toUpperCase());
          }

          newRow[col.header] = value ?? "";
        });

      }

      processedData.push(newRow);
    });

    const filename =
      this.title === "kt-planner"
        ? "Transition Planner"
        : this.title === "action-tracker"
          ? "Action Tracker"
          : this.title === "risk-logs"
            ? "Risk Logs"
            : this.title === "matrix"
              ? "User Matrix"
              : "";

    if (exportType === "EXCEL") {
      this.excelService.ExportTOExcelWithImage(processedData, `${this.transitionData?.transitionNo}_${filename}`);
    } else if (exportType === "PDF") {
      this.excelService.exportToPdf(processedData, `${this.transitionData?.transitionNo}_${filename}`);
    } else if (exportType === "CSV") {
      this.excelService.exportToCsv(processedData, `${this.transitionData?.transitionNo}_${filename}`);
    }
  }

  async onChangeSearch(event: any) {
    this.searchTerm = event.target.value;
    await this.onSearchResult();

  }

  async clearSearch() {
    this.searchTerm = '';
    await this.onSearchResult();
  }

  async updateRows() {
    let currentSectionId: any = null;
    const processRows = this.rows?.map((val, index) => {

      if (val?.isSection) {
        currentSectionId = val.sectionId;
        return val;
      }

      return {
        ...val,
        sectionId: currentSectionId,
        id: index + 1
      }
    });

    this.rows = processRows;
  }

  cancelDeleteColumnConfirm() {
    this.showDeleteColumnConfirm = false;
    this.columnIndex = null;
    this.columnIndexName = null;
  }
  openColumnConfirm(columnIndex: any) {
    this.showDeleteColumnConfirm = true;
    this.columnIndex = columnIndex;
    const columnToDelete = this.columns[columnIndex];
    this.columnIndexName = columnToDelete?.header;
  }

  // Open Column Management Dialog
  async openColumnManagement() {
    this.showColumnDialog = true;
    this.editingColumnIndex = null;
    this.editingColumn = null;

    // Initialize column options map from existing dropdown columns
    await this.initializeColumnOptions();
  }

  // Initialize column options from existing data
  async initializeColumnOptions() {
    this.columnOptionsMap.clear();

    if (this.title === 'kt-planner') {
      // Initialize default dropdown options
      const defaultDropdownFields = ['KT Status', 'RKT Status', 'Pilot Status', "Final Status", 'Go Live', 'Status'];
      defaultDropdownFields.forEach(fieldName => {
        const column = this.columns.find(c => c.header === fieldName);
        if (column && !this.columnOptionsMap.has(column.field)) {
          this.columnOptionsMap.set(column.field, [...this.statusOptions]);
        }
      });
    } else if (this.title === "risk-logs") {
      // Initialize default dropdown options
      const defaultDropdownFields = ['Problem', 'Impact', 'Rating', 'Status'];
      defaultDropdownFields.forEach(fieldName => {
        const column = this.columns.find(c => c.header === fieldName);
        if (column && !this.columnOptionsMap.has(column.field)) {
          this.columnOptionsMap.set(column.field, [...this.riskLogStatusOptions]);
        }
      });

    } else {
      // Initialize default dropdown options
      const defaultDropdownFields = ['Status'];
      defaultDropdownFields.forEach(fieldName => {
        const column = this.columns.find(c => c.header === fieldName);
        if (column && !this.columnOptionsMap.has(column.field)) {
          this.columnOptionsMap.set(column.field, [...this.statusOptions]);
        }
      });
    }
    // Also check for any existing custom dropdown columns that might have options stored
    this.columns.forEach(column => {
      if (column.type === 'dropdown' && column.options) {
        this.columnOptionsMap.set(column.field, column.options);
      } else if (column.type === 'dropdown' && !this.columnOptionsMap.has(column.field)) {
        // Initialize empty options array for dropdown columns
        this.columnOptionsMap.set(column.field, []);
      }
    });
  }

  // Get options for a specific column
  getColumnOptions(column: any): any[] {
    if (!column) return [];

    // // For KT Planner specific fields
    // if (column.field === 'KT Status' || column.field === 'RKT Status' ||
    //   column.field === 'Pilot status' || column.field === 'Go Live') {
    //   return this.statusOptions;
    // }

    // // For Delivery lead/Trainer/Trainees - use users list
    // if (column.field === 'Delivery lead/SM/TM' || column.field === 'Trainees' || column.field === 'Trainer') {
    //   return this.users;
    // }

    // For custom dropdown columns
    return this.columnOptionsMap.get(column.field) || [];
  }

  // Add new column
  addNewColumn() {
    const colIndex = this.columns.filter(col => col.isCustom).length + 1;
    const fieldName = `customCol${Date.now()}`;

    const newColumn = {
      field: fieldName,
      header: `New Column ${colIndex}`,
      type: 'input',
      isCustom: true,
      options: [] // Initialize empty options array
    };

    this.columns = [...this.columns, newColumn];

    // Add the new column to all rows
    this.rows = this.rows.map(row => ({
      ...row,
      [fieldName]: ''
    }));

    // Start editing the new column immediately
    this.editColumn(newColumn, this.columns.length - 1);

    this.bbToaster.show_success("Column added successfully")
  }
  // Edit column
  editColumn(column: any, index: number) {
    this.editingColumnIndex = index;
    this.editingColumn = {
      ...column,
      // Ensure options array exists for dropdown columns
      options: column.type === 'dropdown' ? this.getColumnOptions(column) : []
    };
    this.newOptionValue = '';
  }

  // Save column edits
  async saveColumnEdit() {
    if (!this.editingColumn || this.editingColumnIndex === null) return;

    this.isModified = true;

    // Get the old column to check if field name changed
    const oldColumn = this.columns[this.editingColumnIndex];
    const oldFieldName = oldColumn.field;
    // const newFieldName = this.editingColumn.field;

    // Update the column in columns array
    this.columns[this.editingColumnIndex] = {
      ...this.editingColumn,
      // Preserve the field name if it's a default column
      field: oldColumn.isCustom ? this.editingColumn.field || oldFieldName : oldFieldName
    };

    // If this is a dropdown column, save its options
    if (this.editingColumn.type === 'dropdown') {
      const options = this.columnOptionsMap.get(oldFieldName) || [];
      this.columnOptionsMap.set(this.columns[this.editingColumnIndex].field, options);
      this.columns[this.editingColumnIndex].options = options;
    }

    // If field name changed for custom column, update all rows
    if (oldColumn.isCustom && oldFieldName !== this.columns[this.editingColumnIndex].field) {
      this.rows = this.rows.map(row => {
        const { [oldFieldName]: value, ...rest } = row;
        return {
          ...rest,
          [this.columns[this.editingColumnIndex].field]: value
        };
      });
    }

    // Refresh the columns array to trigger change detection
    this.columns = [...this.columns];

    // Save changes
    await this.updateRows();
    this.originalRows = [...this.rows];
    await this.saveChanges();

    // Exit edit mode
    this.editingColumnIndex = null;
    this.editingColumn = null;
    this.newOptionValue = '';

    this.bbToaster.show_success('Column updated successfully');
  }

  // Cancel column edit
  cancelColumnEdit() {
    this.columnOptionsMap.set(this.columns[this.editingColumnIndex].field, this.columns[this.editingColumnIndex].options);
    this.editingColumnIndex = null;
    this.editingColumn = null;
    this.newOptionValue = '';
  }

  // Handle column type change
  onColumnTypeChange(event: any) {
    if (this.editingColumn) {
      this.editingColumn.type = event.value;

      // Initialize options array for dropdown type
      if (event.value === 'dropdown' && !this.columnOptionsMap.has(this.editingColumn.field)) {
        this.columnOptionsMap.set(this.editingColumn.field, []);
      }
    }
  }

  // Add option to dropdown column
  addColumnOption(column: any) {
    console.log('column: ', column);
    if (!this.newOptionValue?.trim()) return;

    const optionValue = this.newOptionValue.trim();
    const newOption = {
      label: optionValue,
      value: optionValue
    };

    // Get existing options or initialize new array
    let options = this.columnOptionsMap.get(column.field) || [];
    options = [...options, newOption];
    this.columnOptionsMap.set(column.field, options);

    // Update the column's options property
    if (this.editingColumn && this.editingColumn.field === column.field) {
      this.editingColumn.options = options;
    }

    // Clear input
    this.newOptionValue = '';
  }

  // Remove option from dropdown column
  removeColumnOption(column: any, optionIndex: number) {
    let options = this.columnOptionsMap.get(column.field) || [];
    options = options.filter((_, index) => index !== optionIndex);
    this.columnOptionsMap.set(column.field, options);

    // Update the column's options property
    if (this.editingColumn && this.editingColumn.field === column.field) {
      this.editingColumn.options = options;
    }

    // Also update any existing rows that had this value
    this.rows = this.rows.map(row => {
      if (row[column.field] === options[optionIndex]?.value) {
        row[column.field] = '';
      }
      return row;
    });
  }

  // Override getDropdownOptions to use column-specific options
  getDropdownOptions(fieldName: string): any[] {
    const column = this.columns.find(col => col.field === fieldName);
    if (column?.options?.length > 0) {
      return column?.options;
    }

    if (column && column.type === 'dropdown') {
      return this.columnOptionsMap.get(fieldName) || [];
    }

    return [];
  }

  trimSectionName() {
    if (this.sectionName) {
      this.sectionName = this.sectionName.trim();
    }
  }

  Math = Math;

  // Get current page number (1-based)
  getCurrentPage(): number {
    return Math.floor(this.first / this.rowsPerPage) + 1;
  }

  // Get total number of pages
  getTotalPages(): number {
    return Math.ceil(this.totalRecords / this.rowsPerPage);
  }

  // Add these methods for the compact version
  onRowsPerPageChange(event: any) {
    this.rowsPerPage = parseInt(event.target.value, 10);
    this.first = 0; // Reset to first page when changing rows per page
    this.cdr.detectChanges();
  }

  goToFirstPage() {
    this.first = 0;
    this.cdr.detectChanges();
  }

  goToPreviousPage() {
    if (this.first > 0) {
      this.first = Math.max(0, this.first - this.rowsPerPage);
      this.cdr.detectChanges();
    }
  }

  goToNextPage() {
    if (this.first + this.rowsPerPage < this.totalRecords) {
      this.first = this.first + this.rowsPerPage;
      this.cdr.detectChanges();
    }
  }

  goToLastPage() {
    const lastPageFirst = Math.floor((this.totalRecords - 1) / this.rowsPerPage) * this.rowsPerPage;
    this.first = lastPageFirst;
    this.cdr.detectChanges();
  }

  confirmImport() {
    if (this.rows?.length > 0) {
      this.replacConfirmeModal = true;
    } else {
      this.uploadFile();
    }
  }
  checkEditable() {
    if (this.transitionData?.isCustomerPortal) return false;
    if (this.templateData?.isNew) return false;
    if (this.transition_completed) return false;
    if (this.templateData?.isHold) return false;
    if (this.templateData?.isCancel) return false;
    return true;
  }

  // Can edit cell data
  canEditData(): boolean {
    if (this.transitionData?.isCustomerPortal) return false;
    if (this.templateData?.isNew) return false;
    if (this.transition_completed) return false;
    if (this.templateData?.isHold) return false;
    if (this.templateData?.isCancel) return false;
    return true;
  }

  // Can reorder columns/rows
  canReorder(): boolean {
    if (this.transitionData?.isCustomerPortal) return false;
    if (this.templateData?.isNew) return false;
    if (this.transition_completed) return false;
    if (this.templateData?.isHold) return false;
    if (this.templateData?.isCancel) return false;
    return true;
  }

  // Can resize columns
  canResize(): boolean {
    if (this.transitionData?.isCustomerPortal) return false;
    if (this.templateData?.isNew) return false;
    if (this.transition_completed) return false;
    if (this.templateData?.isHold) return false;
    if (this.templateData?.isCancel) return false;
    return true;
  }

  // Can select rows (show checkboxes)
  canSelect(): boolean {
    if (this.transitionData?.isCustomerPortal) return false;
    if (this.templateData?.isNew) return false;
    if (this.transition_completed) return false;
    if (this.templateData?.isHold) return false;
    if (this.templateData?.isCancel) return false;
    return true;
  }
}