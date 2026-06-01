import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
// import { NgbAlertModule, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { JsonPipe } from '@angular/common';
import { BsDatepickerModule, BsDatepickerConfig } from 'ngx-bootstrap/datepicker';
import { BbStoreService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';

interface SelectedDate {
  startDate: Date | null;
  endDate: Date | null;
}

@Component({
  selector: 'app-bs-single-datepicker',
  imports: [ReactiveFormsModule, FormsModule, CommonModule, BsDatepickerModule],
  templateUrl: './bs-single-datepicker.component.html',
  styleUrl: './bs-single-datepicker.component.scss'
})
export class BsSingleDatepickerComponent implements OnInit, OnChanges {
  private bbStore = inject(BbStoreService);

  @Input() label!: string;
  @Input() withTimepicker: boolean = false;
  @Input() default_date: any;
  @Input() readonlyInput: boolean = false;
  defTimeZone: any;
  defDateFormat: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  @Output() datechange = new EventEmitter<SelectedDate | null>();
  selected: any;

  mandatory_icon = true;

  bsConfig: Partial<BsDatepickerConfig> = {
    dateInputFormat: 'MM/DD/YYYY',
    showWeekNumbers: false,
    containerClass: 'theme-default',
    minDate: new Date(1000, 0, 1),
    maxDate: new Date(3000, 11, 31),
    adaptivePosition: true,
    customTodayClass: 'today-highlight',
    selectFromOtherMonth: true
  };
  // [bsConfig]="{withTimepicker: true, keepDatepickerOpened: true, rangeInputFormat : 'MMMM Do YYYY, h:mm:ss a', dateInputFormat: 'MMMM Do YYYY, h:mm:ss a'}"

  private onChange = (_value: any) => { };
  private onTouched = () => { };
  private mapToBsDateFormat(format: string): string {
    // You can expand this mapping as needed
    switch (format.toLowerCase()) {
      case 'mm/dd/yyyy':
        return 'MM/DD/YYYY';
      case 'dd/mm/yyyy':
        return 'DD/MM/YYYY';
      case 'yyyy/mm/dd':
        return 'YYYY/MM/DD';
      default:
        return 'MM/DD/YYYY'; // fallback
    }
  }

  ngOnInit(): void {
    this.defTimeZone = this.bbStore.getItem("timeZoneKey");
    this.defDateFormat = this.bbStore.getItem("dateFormatkey");

    let format = this.mapToBsDateFormat(this.defDateFormat);

    if (this.withTimepicker) {
      format += ', h:mm:ss a'; // Append time part if timepicker enabled
    }

    if (this.withTimepicker) {
      this.bsConfig = {
        dateInputFormat: format,
        showWeekNumbers: false,
        containerClass: 'theme-default',
        minDate: new Date(1000, 0, 1),
        maxDate: new Date(3000, 11, 31),
        adaptivePosition: true,
        customTodayClass: 'today-highlight',
        selectFromOtherMonth: true,
        withTimepicker: true,
        keepDatepickerOpened: true,
      }
    } else {
      this.bsConfig = {
        dateInputFormat: format,
        showWeekNumbers: false,
        containerClass: 'theme-default',
        minDate: new Date(1000, 0, 1),
        maxDate: new Date(3000, 11, 31),
        adaptivePosition: true,
        customTodayClass: 'today-highlight',
        selectFromOtherMonth: true
      }
    }
    this.initializeSelectedDate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['default_date']) {
      this.initializeSelectedDate();
    }
  }

  initializeSelectedDate(): void {
    if (this.default_date?.start !== undefined) {
      this.selected = this.default_date?.start;
      this.onChange(this.selected);
    } else {
      this.selected = null;
    }
  }

  setDate(event: any): void {
    // console.log('event: ', event);
    if (event == "Invalid Date") {
      // console.log('event-------------: ', event);
      this.selected = null;
    } else {
      let obj: any;
      if (event !== undefined) {
        event.getHours();
        // console.log('event.getHours(): ', event.getHours());
        if (event.getHours() === 0) {
          event.setHours(7, 0, 0, 0);
        }
        if (event) {
          // console.log('event: ', event);
          obj = {
            startDate: event,
            endDate: event,
          };
        } else {
          obj = {
            startDate: this.default_date?.start,
            endDate: this.default_date?.start,
          };
        }
        this.selected = event;
        this.datechange.emit(obj);
      } else {
        this.selected = null;
      }
      this.onChange(obj);
    }
  }

  writeValue(value: any): void {
    if (value) {
      this.selected = value;
      this.initializeSelectedDate();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {
    // Handle the disabled state
  }
  preventTyping(event: KeyboardEvent): void {
    event.preventDefault();
  }

  clearSelectedDate(): void {
    this.selected = null;
    this.default_date = null;
    this.datechange.emit({ startDate: null, endDate: null });
    this.onChange(null);
    this.onTouched();
  }


}
