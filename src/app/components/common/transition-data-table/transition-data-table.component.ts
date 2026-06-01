import { CommonModule } from '@angular/common';
import { Component, Input, Output, ViewChild, EventEmitter, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormioModule } from '@formio/angular';
import { BbStoreService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { TransitionService } from 'projects/customer-management-ui/shared/transition/transition.service';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { DynamicHeightDirective } from '../../sharedUI/directives/dynamic-height.directive';
import { Dialog } from 'primeng/dialog';
import { AgGridDataTableComponent } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/ag-grid-datatable/ag-grid-datatable.component';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import moment from 'moment';

@Component({
  selector: 'app-transition-data-table',
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    FormioModule,
    DynamicHeightDirective,
    Dialog,
    TextareaModule,
    ButtonModule,
    AgGridDataTableComponent],
  templateUrl: './transition-data-table.component.html',
  styleUrl: './transition-data-table.component.scss'
})
export class TransitionDataTableComponent {
  private transitionService = inject(TransitionService);
  private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  @Input() formData: any;
  @Input() templateData: any;
  @Input() enableHeight: boolean = false;
  @Input() disabledComment: boolean = false;
  commentsColumnData: any = [
    {
      headerName: "Date & Time",
      field: "Date & Time",
      sortable: true,
      filter: false,
    },
    {
      headerName: "User Name",
      field: "User Name",
      sortable: true,
      filter: false,
    },
    {
      headerName: "Comments",
      field: "Comments",
      sortable: true,
      filter: false,
      // tooltipValueGetter: (params: any) => params.value,
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
      cellRenderer: (params: any) => {
        if (params.data?.isCurrentUser) {
          return `
                    <span class="action-icons">
                      <div class="d-flex align-items-center gap-4 mt-3">
                        <i class="bi bi-pencil-square  before:text-[16px] cursor-pointer" title="Edit" data-action="edit"></i>
                        <i class="bi bi-trash text-danger  before:text-[16px] cursor-pointer control-delete DeleteButton" title="Delete"  data-action="delete"></i>
                      </div>
                    </span>
                  `;

        } else {
          return `
                    
                  `;
        }
      },

      onCellClicked: (params: any) => {
        console.log('params: ', params);
        const event = params.event as MouseEvent;
        const target = event.target as HTMLElement;

        const actionEl = target.closest("[data-action]") as HTMLElement;
        if (!actionEl) return;
        const action = actionEl.dataset["action"];

        if (!action) return;
        switch (action) {
          case "edit":
            this.loadUpdateComment(params.data?._id);
            break;
          case "delete":
            this.deleteTransitionComment(params.data?._id);
            break;
        }
      },

      suppressMenu: true,
      sortable: false,
      filter: false,
    },

  ];
  commentsList: any[] = [];
  commentsTableData: any = [];
  formInstance: any;
  @ViewChild('formioComp') formioComp: any;
  initialized = false;
  // @ViewChild('formioRef') formioRef: any;
  @ViewChild("setFormIoWidth", { static: false }) setFormIoWidth!: ElementRef;
  showCommentPopup = false;
  popupPosition = { top: 0, left: 0 };
  @Output() transitionId = new EventEmitter<any>();
  @Output() onChangeValues = new EventEmitter<any>();
  modalComponentKey!: string;
  editCommantId: string | null = null;
  Comment: string = "";
  templateId!: string;
  selectedRowIndex: number | null = null;
  commentForm: FormGroup;
  private observer!: MutationObserver;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() {
    this.commentForm = this.fb.group({
      comment: ["", Validators.required],
    });
  }
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
  defTimeZone: any;
  defDateFormat: any;
  async ngOnInit() {
    this.defTimeZone = this.bbStore.getItem("timeZoneKey");
    this.defDateFormat = this.mapToBsDateFormat(this.bbStore.getItem("dateFormatkey"));
  }
  // async ngOnChanges(changes: SimpleChanges) {
  //   console.log('changes: ', changes);
  //   if (changes["templateData"]) {
  //     if (this.showCommentPopup) {
  //       this.commentsList = [];
  //       const filterComments = this.templateData?.transition_comments?.filter((item: any) => item?.key === this.modalComponentKey);
  //       this.commentsList = filterComments?.map((item: any) => {
  //         const firstLetter = item?.cCreatedBy?.charAt(0)?.toUpperCase() || 'A';

  //         const colorMap: { [key: string]: string } = {
  //           A: 'red', B: 'orange', C: 'yellow', D: 'green', E: 'blue',
  //           F: 'indigo', G: 'violet', H: 'brown', I: 'pink', J: 'cyan',
  //           K: 'lime', L: 'teal', M: 'maroon', N: 'navy', O: 'olive',
  //           P: 'gold', Q: 'coral', R: 'plum', S: 'salmon', T: 'skyblue',
  //           U: 'slategray', V: 'steelblue', W: 'tan', X: 'tomato', Y: 'turquoise', Z: 'orchid'
  //         };

  //         const color = colorMap[firstLetter] || 'gray';
  //         return {
  //           "Date & Time": moment(item?.cCreatedAt)
  //             .tz(this.defTimeZone)
  //             .format(`${this.defDateFormat.toUpperCase()} HH:mm`), userName: item?.cCreatedBy,
  //           "User Name": item?.cCreatedBy,
  //           timeAgo: dayjs(item?.cCreatedAt).fromNow(),
  //           message: item?.cComment,
  //           Comments: item?.cComment,
  //           color: color,
  //           ...item,
  //           isCurrentUser: this.bbStore.getItem("userId") === item?.cCreatedById,
  //         };
  //       })?.sort(
  //         (a: any, b: any) =>
  //           new Date(b.cCreatedAt).getTime() - new Date(a.cCreatedAt).getTime()
  //       );
  //     }
  //   }
  // }
  onFormRendered() {
    setTimeout(() => {
      document.querySelectorAll(".customerEditableRow").forEach(el => {
        const tr = el.closest("tr");
        if (tr) {
          tr.classList.add("customer-editable-row");
        }
      });
      document.querySelectorAll("div.milestone-header-cell").forEach(div => {
        const tr = div.closest("tr");
        if (tr) {
          tr.classList.add("milestone-header-row");
        }
      });
    }, 0);
  }

  onFormReady(event: any) {
    this.formInstance = event.formio;

    this.formInstance.formReady.then(() => {
      this.initialized = true;
      this.formInstance.everyComponent((_c: any) => {
      });
    });
  }

  async customEvent(event: any) {
    try {
      if (event.type === 'openCommentModal') {
        // this.popupPosition = { top: 0, left: 0 };
        const key = event?.component?.key;
        this.modalComponentKey = key;
        await this.getComments(key)
        // const splitKey = key?.split(" ");
        // const btnKey = splitKey?.length > 1 ? splitKey[0] : key;
        // const buttonElement = document.querySelector(
        //   `.formio-component-${btnKey} button`
        // ) as HTMLElement;

        // if (buttonElement) {
        //   const rect = buttonElement.getBoundingClientRect();
        //   this.popupPosition = {
        //     top: rect.bottom + window.scrollY + 8,
        //     left: rect.left + window.scrollX - 350 // Adjust based on popup width
        //   };
        // }

        this.showCommentPopup = true;

        // // Outside click handler
        // setTimeout(() => {
        //   window.addEventListener('click', this.handleOutsideClick);
        // });
      } else if (event.type === "movePhase") {
        // console.log('event-movephase: ', event);
        const templateId = event.component.key.split(" ");
        this.handleTemplateId(templateId)
      }

    } catch (error) {
      console.log('error: ', error);

    }

  }

  onFormChange(event: any) {
    if (!this.initialized || !event?.data) return;
    // console.log('Form changed:', event);
    this.handleUpdatedTemplate(event);

  }

  handleOutsideClick = (event: any) => {
    const popupEl = document.getElementById('comment-popup');
    const clickedInside = popupEl?.contains(event.target);
    const buttons = document.querySelectorAll('[class*="formio-component-commentIconBtn"]');

    let clickedOnButton = false;
    buttons.forEach(btn => {
      if (btn.contains(event.target)) clickedOnButton = true;
    });

    if (!clickedInside && !clickedOnButton) {
      this.showCommentPopup = false;
      window.removeEventListener('click', this.handleOutsideClick);
      this.Comment = "";

    }
  };

  ngOnDestroy() {
    window.removeEventListener('click', this.handleOutsideClick);
    if (this.observer) this.observer.disconnect();
  }

  handleTemplateId(templateId: string[]) {
    if (templateId?.length > 1) {
      this.transitionId.emit(templateId[1]);
    }
  }
  handleUpdatedTemplate(template: any) {
    this.onChangeValues.emit(template);

  }

  async getComments(key: any) {
    // console.log('this.formData---------comments: ', this.formData);
    try {
      const comments = await firstValueFrom(this.transitionService.getByIdTransitionComments({
        templateId: this.formData?.templateId,
        key: key,
        transitionId: this.formData?.transitionId,
        type: this.formData?.type
      }))
      // console.log('comments: ', comments);
      if (comments.success) {
        dayjs.extend(relativeTime);

        this.commentsList = comments.data?.map((item: any) => {
          const firstLetter = item?.userName?.charAt(0)?.toUpperCase() || 'A';

          const colorMap: { [key: string]: string } = {
            A: 'red', B: 'orange', C: 'yellow', D: 'green', E: 'blue',
            F: 'indigo', G: 'violet', H: 'brown', I: 'pink', J: 'cyan',
            K: 'lime', L: 'teal', M: 'maroon', N: 'navy', O: 'olive',
            P: 'gold', Q: 'coral', R: 'plum', S: 'salmon', T: 'skyblue',
            U: 'slategray', V: 'steelblue', W: 'tan', X: 'tomato', Y: 'turquoise', Z: 'orchid'
          };

          const color = colorMap[firstLetter] || 'gray';
          return {
            "Date & Time": moment(item?.dUpdatedAt)
              .tz(this.defTimeZone)
              .format(`${this.defDateFormat.toUpperCase()} HH:mm`), userName: item?.userName,
            "User Name": item?.userName,
            timeAgo: dayjs(item?.dUpdatedAt).fromNow(),
            message: item?.cComment,
            Comments: item?.cComment,
            color: color,
            ...item,
          };
        })?.sort(
          (a: any, b: any) =>
            new Date(b.dUpdatedAt).getTime() - new Date(a.dUpdatedAt).getTime()
        );
      }
    } catch (error) {
      console.log('error: ', error);

    }
  }

  async handleUpdateComment() {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      this.bbToaster.show_error('Please enter required fields')
      return;
    }
    if (this.commentForm.get('comment')?.value.trim().length === 0) {
      this.bbToaster.show_error('Comment cannot be empty or contain only spaces')
      return;
    }
    try {
      const payload = {
        key: this.modalComponentKey,
        cComment: this.commentForm.get('comment')?.value ? this.commentForm.get('comment')?.value : this.Comment,
        oActivation_Id: this.formData?.oActivation_Id,
        oTemplateId: this.formData?.templateId ?? null,
        _id: this.editCommantId,
        type: this.formData?.type
      }

      const create = await firstValueFrom(this.transitionService.updateTransitionComment(payload, this.editCommantId));

      if (create?.success) {
        this.bbToaster.show_success(
          "Comments updated successfully"
        );
      }
      // console.log('create: ', create);
    } catch (error) {
      console.log('error: ', error);

    } finally {
      await this.getComments(this.modalComponentKey);
      this.Comment = "";
      this.editCommantId = null;
      this.commentForm.reset();
    }
  }

  loadUpdateComment(id: any) {
    this.editCommantId = null;
    this.commentForm.get('comment')?.setValue(null);
    const comment = this.commentsList?.find((val) => val._id === id);
    this.editCommantId = comment?._id;
    this.Comment = comment?.cComment;
    this.commentForm.get('comment')?.setValue(this.Comment);
    this.cdr.detectChanges();
  }

  async handleCreateComment() {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      //if comment is empty or only spaces show warning
      this.bbToaster.show_error('Please enter required fields')
      return;
    }

    if (this.commentForm.get('comment')?.value.trim().length === 0) {
      this.bbToaster.show_error('Comment cannot be empty or contain only spaces')
      return;
    }
    try {
      const payload = {
        key: this.modalComponentKey,
        cComment: this.commentForm.get('comment')?.value ? this.commentForm.get('comment')?.value : this.Comment,
        oActivation_Id: this.formData?.oActivation_Id,
        transitionId: this.formData?.transitionId,
        oTemplateId: this.formData?.templateId ?? null,
        type: this.formData?.type
      }

      const create = await firstValueFrom(this.transitionService.createTransitionComment(payload));

      if (create?.success) {
        this.bbToaster.show_success(
          "Comments added successfully"
        );
      }
      // console.log('create: ', create);
    } catch (error) {
      console.log('error: ', error);

    } finally {
      await this.getComments(this.modalComponentKey);
      this.Comment = "";
      this.commentForm.reset();
    }
  }

  async deleteTransitionComment(id: any) {
    try {
      const deleteComment = await firstValueFrom(this.transitionService.deleteTransitionComment(id));
      if (!deleteComment?.success) {
        this.bbToaster.show_error(deleteComment?.message)
      } else {
        this.bbToaster.show_success(
          "Comments deleted successfully"
        );
      }
    } catch (error) {
      console.log('error: ', error);

    } finally {
      this.editCommantId = null;
      this.Comment = "";
      this.commentForm.reset();
      await this.getComments(this.modalComponentKey);
    }
  }

  onChangeComments(event: any): void {
    this.Comment = event.target.value;
  }

  ngAfterViewInit() {
    this.waitForTableRender();
  }
  //access shadow dom table
  waitForTableRender() {
    const targetNode = this.setFormIoWidth.nativeElement;
    this.observer = new MutationObserver((_mutations, _obs) => {
      const table = targetNode.querySelector(".formio-component-table .table");
      // console.log(table,"table");
      if (table) {
        this.adjustTableWidth(table);
        // obs.disconnect(); // Stop observing once found
      }
    });
    this.observer.observe(targetNode, {
      childList: true, // Watch for added/removed elements
      subtree: true, // Check all nested elements
    });
  }

  adjustTableWidth(table: HTMLElement) {
    // debugger;
    // console.log(this.formData.components[0],"len");
    if (this.formData.components[0]?.numCols < 12) {
      table.classList.add("fit-width-tble");
    }
  }

  // NEW METHOD: Update form component without re-render
  updateFormComponent(key: string, value: any) {
    if (!this.initialized || !this.formInstance) return;

    const component = this.formInstance.getComponent(key);

    if (!component) {
      console.warn('Component not found:', key);
      return;
    }

    this.formInstance.data[key] = value;
    if (component) {
      component.component.defaultValue = value;
    }
    component.setValue(value, { modified: false, noValidate: true });

    if (key.startsWith('score_') || key.startsWith('kpi_score_') || key.startsWith('tollgate_score_')) {
      component.component.label = value;

      if (component.component.type === 'content') {
        component.component.html = value;
      }

      component.redraw();
    }
  }

  updateFormDropdownValueComponent(key: string, values: any[]) {
    if (!this.initialized || !this.formInstance) return;

    console.log('this.formInstance: ', this.formInstance);
    const component = this.formInstance.getComponent(key);

    if (!component) {
      console.log('Component not found:', key);
      return;
    }

    // ✅ Force Form.io to accept dynamic values
    component.component.dataSrc = 'values';
    component.component.data = component.component.data || {};
    component.component.data.values = [...values];

    // ✅ Clear existing value (important)
    component.setValue(null, { noUpdateEvent: true });

    // ✅ Reset items cache
    component.items = null;

    // ✅ Set new items
    component.setItems(values);

    // ✅ Force redraw
    component.redraw();
    console.log(
      'Updated dropdown values:',
      component.component.data.values
    );
  }

  // NEW METHOD: Update multiple components at once
  updateFormValues(values: { [key: string]: any }) {
    if (!this.initialized || !this.formInstance) return;

    Object.entries(values).forEach(([key, value]) => {
      const component = this.formInstance.getComponent(key);
      if (component) {
        this.formInstance.data[key] = value;
        component.setValue(value, { modified: false, noValidate: true });
      }
    });
  }

  closeCommentModal() {
    this.showCommentPopup = false;
    this.Comment = "";
    this.editCommantId = null;
    this.commentForm.reset();
  }

  clearCommentForm() {
    this.Comment = "";
    this.editCommantId = null;
    this.commentForm.reset();
  }

  // Update submitComment method to handle HTML content
  async submitComment() {
    if (this.commentForm.valid && this.selectedRowIndex !== null) {
      try {

      } catch (err) {
        console.log('err: ', err);

      }
    }
  }

  formatDateTimeWithTimezone(dateString: string): string {
    if (!dateString) return "N/A";

    const dateFormat = this.bbStore.getItem("dateFormatkey") || "yyyy/mm/dd";
    return moment(dateString).format(`${dateFormat.toUpperCase()} HH:mm`);
    // try {
    //   const formatter = new Intl.DateTimeFormat("en-US", {
    //     timeZone: timezone,
    //     year: "numeric",
    //     month: "2-digit",
    //     day: "2-digit",
    //     hour: "2-digit",
    //     minute: "2-digit",
    //     hour12: false,
    //   });

    //   const parts = formatter.formatToParts(date);

    //   const month = parts.find((part) => part.type === "month")?.value;
    //   const day = parts.find((part) => part.type === "day")?.value;
    //   const year = parts.find((part) => part.type === "year")?.value;
    //   const hour = parts.find((part) => part.type === "hour")?.value;
    //   const minute = parts.find((part) => part.type === "minute")?.value;

    //   // Format date based on the stored date format
    //   let formattedDate: string;

    //   switch (dateFormat?.toLowerCase()) {
    //     case "mm/dd/yyyy":
    //       formattedDate = `${month}/${day}/${year}`;
    //       break;
    //     case "dd/mm/yyyy":
    //       formattedDate = `${day}/${month}/${year}`;
    //       break;
    //     case "yyyy/mm/dd":
    //     default:
    //       formattedDate = `${year}/${month}/${day}`;
    //       break;
    //   }

    //   return `${formattedDate} ${hour}:${minute}`;
    // } catch (error) {
    //   console.error("Error formatting date with timezone:", error);
    //   // Fallback format
    //   const month = (date.getMonth() + 1).toString().padStart(2, "0");
    //   const day = date.getDate().toString().padStart(2, "0");
    //   const year = date.getFullYear();
    //   const hour = date.getHours().toString().padStart(2, "0");
    //   const minute = date.getMinutes().toString().padStart(2, "0");

    //   let formattedDate: string;

    //   switch (dateFormat?.toLowerCase()) {
    //     case "mm/dd/yyyy":
    //       formattedDate = `${month}/${day}/${year}`;
    //       break;
    //     case "dd/mm/yyyy":
    //       formattedDate = `${day}/${month}/${year}`;
    //       break;
    //     case "yyyy/mm/dd":
    //     default:
    //       formattedDate = `${year}/${month}/${day}`;
    //       break;
    //   }

    //   return `${formattedDate} ${hour}:${minute}`;
    // }
  }

}