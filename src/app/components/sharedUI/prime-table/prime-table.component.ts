import { Component, EventEmitter, Input, Output, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { BbTableDynamicHeightDirective } from '../directives/bb-table-dynamic-height.directive';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { ViewChild } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';

export interface PrimeTableColumn {
  headerName: string;
  field: string;
  sortable?: boolean;
  filter?: boolean | string;
  align?: string;
  width?: number;
  useHtml?: boolean;
  valueGetter?: (data: any) => any;
}

@Component({
  selector: 'app-prime-table',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    BbTableDynamicHeightDirective,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  templateUrl: './prime-table.component.html',
  styleUrl: './prime-table.component.scss' // Use styleUrl specifically for Angular 14+ new builder optionally
})
export class PrimeTableComponent {
  @Input() columns: PrimeTableColumn[] = [];
  @Input() data: any[] = [];

  // Table Configuration Options
  @Input() paginator: boolean = true;
  @Input() rows: number = 50;
  @Input() rowsPerPageOptions: number[] = [25, 50, 75, 100, 150, 200];

  // Custom height offset if dynamic height calculates imperfectly
  @Input() heightOffset: number = 0;
  @Input() minHeight: string = "300px";
  @Input() showGlobalFilter: boolean = false;
  @Input() globalFilterFields: string[] = [];
  @Input() placeholder: string = "Search...";

  @ViewChild('dt') table!: Table;

  // Custom Action Template support
  @ContentChild('actionTemplate') actionTemplate!: TemplateRef<any>;

  // Action Event Emitter
  @Output() actionClicked = new EventEmitter<{ action: string, rowData: any }>();
  @Output() rowClicked = new EventEmitter<any>();

  // Internal tracking
  tableHeight: string = "auto";

  onAction(actionType: string, data: any, event: MouseEvent) {
    event.stopPropagation();
    this.actionClicked.emit({ action: actionType, rowData: data });
  }

  onRowClick(data: any) {
    this.rowClicked.emit(data);
  }

  // Helper method to resolve field data (handles nesting like 'a.b.c' and valueGetter)
  resolveFieldData(data: any, col: PrimeTableColumn): any {
    if (col.valueGetter) {
      return col.valueGetter(data);
    }
    const field = col.field;
    if (data && field) {
      if (field.indexOf('.') === -1) {
        return data[field];
      } else {
        const fields: string[] = field.split('.');
        let value = data;
        for (let i = 0, len = fields.length; i < len; ++i) {
          if (value == null) {
            return null;
          }
          const f = fields[i];
          if (f === undefined) break;
          value = value[f];
        }
        return value;
      }
    }
    return null;
  }

  // Helper method to clear filters safely if we end up needing it
  clearFilter(dt: any) {
    if (dt && dt.clear) {
      dt.clear();
    }
  }
}