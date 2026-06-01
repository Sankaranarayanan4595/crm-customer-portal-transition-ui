import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { SelectItem } from 'primeng/api';
import { Select } from 'primeng/select';
// Note: Ensure this directive exists in your project, or remove it from imports/html if you don't use it.
import { DynamicHeightDirective } from '../../sharedUI/directives/dynamic-height.directive';

interface TableHeader {
  field: string;
  label: string;
  type?: 'text' | 'percentage' | 'status' | 'select' | 'datetime' | 'number' | string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  editable?: boolean;
  hasFilter?: boolean;
  placeholder?: string;
}

interface TableRow {
  [key: string]: any;
  highlight?: boolean;
  isEditable?: boolean;
  transitionId?: string;
  commentCount?: number;
}

interface FormioComponent {
  type?: string;
  label?: string;
  key?: string;
  html?: string;
  defaultValue?: any;
  value?: any;
  data?: {
    values?: Array<{ label: string; value: string }>;
  };
  enableTime?: boolean;
  placeholder?: string;
  format?: string;
  oldValue?: any;
  disabled?: boolean;
  action?: string;
  event?: string;
  properties?: any;
}

interface CellChangeEvent {
  isModified: boolean;
  changed: {
    component: {
      key: string;
      type: string;
      label?: string | undefined;
      index?: string | null | undefined;
    };
    value: any;
    oldValue: any;
  };
  data: any;
}

@Component({
  selector: 'app-dynamic-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    Select,
    DatePickerModule,
    CardModule,
    DynamicHeightDirective // Remove if you don't have this directive
  ],
  templateUrl: './dynamic-table.component.html',
  styleUrls: ['./dynamic-table.component.scss']
})
export class DynamicTableComponent implements OnInit, OnChanges {
  @Input() formData: any;
  @Input() tableId: string = 'dynamic-table';

  @Output() transitionId = new EventEmitter<any>();
  @Output() cellValueChanged = new EventEmitter<CellChangeEvent>();

  headers: TableHeader[] = [];
  tableData: TableRow[] = [];
  private originalValues: Map<string, any> = new Map();

  statusOptions: SelectItem[] = [
    { label: 'YET TO START', value: 'YET TO START' },
    { label: 'IN PROGRESS', value: 'IN PROGRESS' },
    { label: 'COMPLETED', value: 'COMPLETED' },
    { label: 'ON HOLD', value: 'ON HOLD' }
  ];

  ngOnInit() {
    if (this.formData) {
      this.parseFormioData(this.formData);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['formData'] && changes['formData'].currentValue) {
      this.parseFormioData(changes['formData'].currentValue);
    }
  }

  // Translates Form.io JSON into PrimeNG Table definitions
  private parseFormioData(formData: any) {
    const tableComponent = formData?.components?.[0];
    if (!tableComponent || !tableComponent.rows || tableComponent.rows.length === 0) {
      this.headers = [];
      this.tableData = [];
      return;
    }

    const rows = tableComponent.rows;

    // 1. Map Headers from Row 0
    this.headers = rows[0].map((column: any, index: number) => {
      const comp: FormioComponent = column.components?.[0] || {};
      let fieldName = comp.key || `col_${index}`;

      // Fallback if keys are missing
      if (fieldName === `col_${index}` && comp.label) {
        fieldName = comp.label.replace(/\s+/g, '_');
      }

      let type = comp.type || 'text';
      if (comp.key?.startsWith('score_')) type = 'percentage';
      if (comp.key?.startsWith('status_')) type = 'status';

      return {
        field: fieldName,
        label: (comp.label || comp.html || `Column ${index}`).replace(/<[^>]*>?/gm, ''), // strip raw HTML
        type: type,
        editable: !comp.disabled,
        width: 'auto'
      };
    });

    // 2. Map Data from Rows 1 to N
    this.tableData = rows.slice(1).map((row: any[], rowIndex: number) => {
      const rowData: TableRow = {
        isEditable: true
      };

      row.forEach((column: any, colIndex: number) => {
        const headerField = this.headers[colIndex]?.field;
        if (!headerField) return;

        const comp: FormioComponent = column.components?.[0];
        if (comp) {
          if (comp.defaultValue !== undefined && comp.value === undefined) {
            comp.value = comp.defaultValue;
          }
          comp.oldValue = comp.value || comp.defaultValue;
          this.storeOriginalValue(rowIndex, headerField, comp.oldValue);

          rowData[headerField] = comp;

          // Badges / Comments Parsing
          if (comp.key?.startsWith('commentIconBtn')) {
            const match = comp.label?.match(/badge-count'>(\d+)<\/span>/);
            rowData.commentCount = match ? parseInt(match[1] || '0', 10) : 0;
          }

          // Phase / Transition Link Binding
          if (comp.action === 'event' && comp.event === 'movePhase') {
            rowData.transitionId = comp.properties?.templateId || formData.templateId || comp.value;
          }
        }
      });
      return rowData;
    });
  }

  getHeaderWidth(header: TableHeader): string {
    return header.width || 'auto';
  }

  getCellType(header: TableHeader, cellData: FormioComponent): string {
    return header.type || cellData?.type || 'text';
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-ash';
    switch (status.toUpperCase()) {
      case 'YET TO START': return 'status-ash';
      case 'IN PROGRESS': return 'status-orange';
      case 'COMPLETED': return 'status-green';
      case 'OVERDUE': return 'status-red';
      case 'COMPLETED ON TIME': return 'status-green';
      case 'COMPLETED WITH DELAY': return 'status-red';
      case 'ON HOLD': return 'status-yellow';
      default: return 'status-ash';
    }
  }

  validatePercentage(cellData: FormioComponent) {
    if (cellData?.value) {
      let num = parseFloat(cellData.value);
      if (isNaN(num)) num = 0;
      if (num < 0) num = 0;
      if (num > 100) num = 100;
      cellData.value = num.toString();
    }
  }

  getSelectOptions(cellData: FormioComponent): SelectItem[] {
    return cellData?.data?.values?.map(item => ({
      label: item.label,
      value: item.value
    })) || [];
  }

  getSelectLabel(cellData: FormioComponent): string {
    const value = cellData?.value || cellData?.defaultValue;
    if (!value) return '';

    const options = this.getSelectOptions(cellData);
    const selectedOption: any = options.find(opt => opt.value === value);
    return selectedOption ? selectedOption.label : value;
  }

  formatDate(dateValue: any): string {
    if (!dateValue) return '';
    if (dateValue instanceof Date) return this.formatDateToString(dateValue);

    if (typeof dateValue === 'string') {
      try {
        const date = new Date(dateValue);
        return !isNaN(date.getTime()) ? this.formatDateToString(date) : dateValue;
      } catch {
        return dateValue;
      }
    }
    return String(dateValue);
  }

  private formatDateToString(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  onCellBlur(rowIndex: number, header: TableHeader, cellData: FormioComponent, _event: Event) {
    const newValue = cellData.value;
    const oldValue = cellData.oldValue || this.getOriginalValue(rowIndex, header.field);

    if (newValue !== oldValue) {
      this.emitCellChange(rowIndex, header, cellData, newValue, oldValue);
      cellData.oldValue = newValue;
    }
  }

  onSelectChange(rowIndex: number, header: TableHeader, cellData: FormioComponent, newValue: any) {
    const oldValue = cellData.oldValue || this.getOriginalValue(rowIndex, header.field);
    if (newValue !== oldValue) {
      this.emitCellChange(rowIndex, header, cellData, newValue, oldValue);
      cellData.oldValue = newValue;
    }
  }

  onDateSelect(rowIndex: number, header: TableHeader, cellData: FormioComponent, date: Date) {
    if (!date) return;
    const newValue = this.formatUTCISOString(date);
    const oldValue = cellData.oldValue || this.getOriginalValue(rowIndex, header.field);

    if (newValue !== oldValue) {
      this.emitCellChange(rowIndex, header, cellData, newValue, oldValue);
      cellData.oldValue = newValue;
    }
  }

  private formatUTCISOString(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    const min = String(date.getUTCMinutes()).padStart(2, '0');
    const s = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${y}-${m}-${d}T${h}:${min}:${s}.${ms}Z`;
  }

  onEditComplete(event: any) {
    const rowIndex = event.index;
    const field = event.field;
    const newValue = event.data[field]?.value;
    const oldValue = event.data[field]?.oldValue;

    if (newValue !== oldValue) {
      const header = this.headers.find(h => h.field === field);
      const rowData = this.tableData[rowIndex];
      if (header && rowData) {
        const cellData = rowData[field];
        if (cellData) {
          this.emitCellChange(rowIndex, header, cellData, newValue, oldValue);
          cellData.oldValue = newValue;
        }
      }
    }
  }

  private emitCellChange(rowIndex: number, header: TableHeader, cellData: FormioComponent, newValue: any, oldValue: any) {
    const rowData = this.tableData[rowIndex];
    if (!rowData) return;
    const componentKey = cellData?.key || header.field;

    // Create a flat data object mapping key -> value for the CURRENT row
    const rowDataObject: any = {};
    Object.keys(rowData).forEach(field => {
      if (['highlight', 'isEditable', 'transitionId', 'commentCount'].includes(field)) return;
      const cell = rowData[field];
      if (cell?.key) {
        rowDataObject[cell.key] = cell.value !== undefined ? cell.value : cell.defaultValue;
      } else {
        rowDataObject[field] = cell?.value !== undefined ? cell.value : cell?.defaultValue;
      }
    });

    let index = null;
    if (componentKey && componentKey.includes('_')) {
      const parts = componentKey.split('_');
      index = parts.length > 1 ? parts[parts.length - 1] : null;
    }

    const changeEvent: CellChangeEvent = {
      isModified: true,
      changed: {
        component: {
          key: componentKey,
          type: cellData?.type || header.type || 'text',
          label: header.label,
          index: index
        },
        value: newValue,
        oldValue: oldValue
      },
      data: rowDataObject
    };

    this.cellValueChanged.emit(changeEvent);
  }

  private storeOriginalValue(rowIndex: number, field: string, value: any) {
    const key = `${rowIndex}_${field}`;
    this.originalValues.set(key, value);
  }

  private getOriginalValue(rowIndex: number, field: string): any {
    const key = `${rowIndex}_${field}`;
    return this.originalValues.get(key);
  }

  handleTemplateId(templateId: string) {
    if (templateId) {
      this.transitionId.emit(templateId);
    }
  }

  onCommentClick(rowData: any, header: any): void {
    console.log('Comment clicked for:', rowData, header);
  }
}