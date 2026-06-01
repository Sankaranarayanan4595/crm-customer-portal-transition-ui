import { CommonModule } from "@angular/common";
import { Component, Input, SimpleChanges, ViewChild, OnDestroy, ElementRef, Renderer2, AfterViewInit, inject } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { Editor, EditorModule } from "primeng/editor";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { BbStoreService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { MastersService } from "projects/customer-management-ui/shared/masters/masters.service";
import { DynamicHeightDirective } from "../directives/dynamic-height.directive";
import { DropdownModule } from "primeng/dropdown";
import { CategoriesService } from "projects/customer-management-ui/shared/categories/categories.service";

// Custom validator for whitespace
export function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  if (control.value) {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = control.value;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    if (textContent.trim().length === 0) {
      return { whitespace: true };
    }
  }
  return null;
}

// Helper to strip HTML tags
function stripHtml(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
}

// Check if HTML has real text
function hasActualTextContent(html: string): boolean {
  const textContent = stripHtml(html);
  return textContent.trim().length > 0;
}

@Component({
  selector: "app-comments-opportunity",
  imports: [
    EditorModule,
    ReactiveFormsModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    CommonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    DynamicHeightDirective,
    DropdownModule,
  ],
  templateUrl: "./comments-opportunity.component.html",
  styleUrl: "./comments-opportunity.component.scss",
})
export class CommentsOpportunityComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private bbStore = inject(BbStoreService);
  private bbToaster = inject(BBToastService);
  private sanitizer = inject(DomSanitizer);
  private masterService = inject(MastersService);
  private CategoriesService = inject(CategoriesService);
  private renderer = inject(Renderer2);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }
  @Input() setCommentHeight: boolean = true;
  commentscroll: any;
  CommentForm!: FormGroup;
  commentVal: any;
  userName: any;
  userId: any;
  commentDetails: any[] = [];
  filteredComments: any[] = [];
  isEditing: boolean = false;
  editingIndex: number | null = null;
  searchText: string = "";
  sortNewestFirst: boolean = true;
  defTimeZone: string = "Asia/Kolkata";
  defDateFormat: any;
  editorModules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ font: [] }],
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ],
  };

  commentTypeOptions = [
    { label: "All", value: "all" },
    { label: "Accounts", value: "accounts" },
    { label: "Opportunities", value: "opportunities" },
  ];
  selectedCommentType: any = { label: "All", value: "all" };

  @ViewChild("editorRef") editor!: Editor;
  @ViewChild("mentionPopup", { read: ElementRef }) mentionPopup!: ElementRef;
  @ViewChild("containerRef", { read: ElementRef }) containerRef!: ElementRef;

  @Input() verticalPos: boolean = false;
  @Input() hidesearch: boolean = true;
  @Input() showToggleCommentBox: boolean = false;
  @Input() EditData: any;
  @Input() commentsData: any;

  users: any[] = [];
  filteredUsers: any[] = [];
  showUserList: boolean = false;
  mentionQuery: string = "";
  mentionedUsers: any[] = [];
  popupPosition = { top: 0, left: 0 };

  private documentClickUnlisten: (() => void) | null = null;

  async ngOnInit() {
    this.CommentForm = this.fb.group({
      cDescription: [null, [Validators.required, noWhitespaceValidator]],
    });

    await this.loadUsers();

    this.userName = this.bbStore.getItem("userName");
    this.userId = this.bbStore.getItem("userId");
    this.defTimeZone = this.bbStore.getItem("timeZoneKey") || "Asia/Kolkata";
    this.defDateFormat = this.bbStore.getItem("dateFormatkey");
    this.commentDetails = this.commentsData || [];
    this.updateCommentsList();

    this.commentscroll = this.getAvailableHeight([0, 100]);
  }

  ngAfterViewInit() {
    this.documentClickUnlisten = this.renderer.listen("document", "click", (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (this.mentionPopup?.nativeElement.contains(target)) return;
      if (this.containerRef?.nativeElement.contains(target)) return;
      this.showUserList = false;
    });
  }

  async loadUsers() {
    try {
      this.users = await this.CategoriesService.getUsers();
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["EditData"] && changes["EditData"].currentValue?.id !== changes["EditData"]?.previousValue?.id) {
      this.resetFilterState();
    }

    if (changes["commentsData"]) {
      this.commentDetails = this.commentsData;
      this.updateCommentsList();
    }
  }

  ngOnDestroy() {
    this.resetFilterState();
    if (this.documentClickUnlisten) this.documentClickUnlisten();
  }

  resetFilterState() {
    this.selectedCommentType = { label: "All", value: "all" };
    this.searchText = "";
    this.sortNewestFirst = true;
    this.isEditing = false;
    this.editingIndex = null;
    this.CommentForm?.reset();
    this.commentVal = null;
  }

  onCommentTypeChange() {
    this.updateCommentsList();
  }

  getAvailableHeight(excessHeights: number[] = []): number {
    const windowHeight = window.innerHeight;
    const totalExcess = excessHeights.reduce((acc, val) => acc + val, 0);
    return windowHeight - totalExcess;
  }

  formatDateTime(date: Date | string): { date: string; time: string } {
    const dateObj = new Date(date);

    // Use the timezone from bbStore
    const timeZone = this.defTimeZone || "Asia/Kolkata";

    // Format date according to bbStore date format
    let formattedDate: string;

    switch (this.defDateFormat) {
      case "dd/mm/yyyy":
        formattedDate = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: timeZone,
        });
        break;
      case "mm/dd/yyyy":
        formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          timeZone: timeZone,
        });
        break;
      case "yyyy-mm-dd":
        formattedDate = dateObj.toLocaleDateString("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: timeZone,
        });
        break;
      default:
        // Use dd/mm/yyyy format as default instead of the short month name format
        formattedDate = dateObj.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: timeZone,
        });
    }

    // Format time according to timezone
    const formattedTime = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone,
    }).format(dateObj);

    return { date: formattedDate, time: formattedTime };
  }

  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  setFocus() {
    if (this.editor) {
      const quill = this.editor.getQuill();
      quill.focus();
    }
  }

  commentInputFocus() {
    this.showToggleCommentBox = false;
    this.setFocus();
  }

  async addComment(onlyshowToggleCommentBox: any) {
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    });

    if (onlyshowToggleCommentBox) {
      this.showToggleCommentBox = true;
      return;
    }

    if (this.CommentForm.invalid) {
      this.CommentForm.markAllAsTouched();
      const descriptionControl = this.CommentForm.get("cDescription");
      if (descriptionControl?.errors?.["whitespace"]) {
        return this.bbToaster.show_error("Comment cannot be empty or contain only spaces.");
      }
      return this.bbToaster.show_error("Please enter a comment.");
    }

    const formValue = this.CommentForm.getRawValue();
    const htmlContent = formValue.cDescription;

    if (!hasActualTextContent(htmlContent)) {
      return this.bbToaster.show_error("Comment cannot be empty or contain only spaces.");
    }

    // Use current date and format it properly
    const now = new Date();
    const empDtls = this.users.find((u) => u._id === this.userId);

    const newComment = {
      cDescription: htmlContent,
      cCreatedBy: empDtls.empId.empName,
      dCreatedDate: now, // Store as Date object for proper sorting
      type: this.EditData?.type,
      mentionedUsers: this.mentionedUsers,
    };

    if (this.isEditing && this.editingIndex !== null) {
      this.commentDetails[this.editingIndex] = newComment;
      await this.updateCommentsInBackend(newComment);
      this.isEditing = false;
      this.editingIndex = null;
    } else {
      this.commentDetails.unshift(newComment);
      await this.updateCommentsInBackend(newComment);
    }

    this.updateCommentsList();
    this.CommentForm?.reset();
    this.commentVal = null;
    this.mentionedUsers = [];
  }

  editComment(index: number) {
    const comment = this.commentDetails[index];
    this.CommentForm.patchValue({
      cDescription: comment.cDescription,
    });
    this.commentVal = comment.cDescription;
    this.isEditing = true;
    this.editingIndex = index;
    this.showToggleCommentBox = false;
    setTimeout(() => this.setFocus(), 0);
  }

  async deleteComment(index: number) {
    const comment = this.commentDetails[index];
    if (!comment?._id) {
      this.bbToaster.show_error("Cannot delete unsaved comment");
      return;
    }
    try {
      const response = await this.masterService.deleteComments(comment._id);
      if (response.success) {
        this.commentDetails.splice(index, 1);
        this.updateCommentsList();
        this.bbToaster.show_success("Comment deleted successfully");
      } else {
        this.bbToaster.show_error(response.message || "Failed to delete comment");
      }
    } catch (error) {
      this.bbToaster.show_error("Failed to delete comment");
      console.error("Error deleting comment:", error);
    }
  }

  updateCommentsList() {
    let filtered = Array.isArray(this.commentDetails) ? [...this.commentDetails] : [];

    if (this.selectedCommentType?.value !== "all") {
      filtered = filtered.filter((comment) => comment.type === this.selectedCommentType.value);
    }

    if (this.searchText) {
      const terms = this.searchText.trim().toLowerCase().split(/\s+/);
      filtered = filtered.filter((comment) =>
        terms.every(
          (term) =>
            comment.cDescription?.toLowerCase().includes(term) || comment.cCreatedBy?.toLowerCase().includes(term)
        )
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.dCreatedDate);
      const dateB = new Date(b.dCreatedDate);
      return this.sortNewestFirst ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    });

    // Ensure all comments have properly formatted dates
    this.filteredComments = filtered.map((comment) => {
      const formatted = this.formatDateTime(comment.dCreatedDate);
      return {
        ...comment,
        formattedDate: formatted.date,
        formattedTime: formatted.time,
      };
    });
  }

  toggleSortOrder() {
    this.sortNewestFirst = !this.sortNewestFirst;
    this.updateCommentsList();
  }

  onSearchChange() {
    this.updateCommentsList();
  }

  clearSearch() {
    this.searchText = '';
    this.onSearchChange();
  }

  cancelEdit() {
    this.isEditing = false;
    this.editingIndex = null;
    this.CommentForm?.reset();
    this.commentVal = null;
  }

  clearComment() {
    this.CommentForm?.reset();
    this.commentVal = null;
    this.isEditing = false;
    this.editingIndex = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.CommentForm?.get(fieldName);
    return !!field && field.invalid && field.touched;
  }

  getFieldError(fieldName: string): string {
    const field = this.CommentForm?.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors["required"]) {
        return "Comment is required";
      }
      if (field.errors["whitespace"]) {
        return "Comment cannot be empty or contain only spaces";
      }
    }
    return "";
  }

  async updateCommentsInBackend(comment: any) {
    try {
      const mentionedUsersPayload =
        Array.isArray(comment.mentionedUsers) && comment.mentionedUsers.length > 0
          ? comment.mentionedUsers.map((m: any) => {
            const matchedUser = this.users.find(
              (u: any) =>
                u._id === m.id || u.empId?._id === m.id || u.unifiedUserId === m.id || u.empId?.unifiedEmpId === m.id
            );
            return {
              id: matchedUser?._id || m.id,
              name: matchedUser?.loginName || m.name,
              email: matchedUser?.empId?.email || "",
            };
          })
          : [];

      const payload = [
        {
          cComments: comment.cDescription,
          oMappedId: this.EditData?.id,
          cCommentsType: this.EditData?.type,
          dCreateAt: comment.dCreatedDate || new Date(),
          dUpdatedAt: new Date(),
          bActive: true,
          mentionedUsers: mentionedUsersPayload,
        },
      ];

      const response = await this.masterService.createComments({ comments: payload });

      if (response.success) {
        this.bbToaster.show_success("Comment saved successfully");
      } else {
        this.bbToaster.show_error("Failed to save comment");
      }
    } catch (error) {
      this.bbToaster.show_error("Something went wrong while saving comment");
      console.error("Save comment error:", error);
    }
  }

  // SIMPLIFIED Editor related handlers
  onEditorKeydown(event: KeyboardEvent) {
    console.log("event: ", event);
    try {
      const quill = this.editor.getQuill();
      const range = quill.getSelection(true) || { index: 0 };

      if (event.key === "@") {
        // Show user list when @ is typed
        this.showUserList = true;
        this.mentionQuery = "";

        // Position popup near cursor
        const bounds = quill.getBounds(range.index);
        this.popupPosition = { top: bounds.top + bounds.height + 6, left: bounds.left };
        this.filteredUsers = this.users;
        return;
      }

      if (event.key === "Escape" || event.key === "Backspace" || event.code === "Space") {
        this.showUserList = false;
        return;
      }

      // Filter users based on typing
      if (this.showUserList) {
        if (event.key.length === 1 && /^[a-zA-Z0-9._-]$/.test(event.key)) {
          this.mentionQuery += event.key.toLowerCase();
          this.filterUsers();
        } else if (event.key === "Backspace") {
          this.mentionQuery = this.mentionQuery.slice(0, -1);
          this.filterUsers();
        } else if (event.key === "Enter" && this.filteredUsers.length > 0) {
          // Insert first user on Enter
          event.preventDefault();
          this.insertMention(this.filteredUsers[0]);
        }
      }
    } catch (err) {
      console.error("Editor keydown handler error:", err);
    }
  }

  filterUsers() {
    const query = this.mentionQuery.toLowerCase();
    this.filteredUsers = this.users.filter((u) => (u.loginName || "").toLowerCase().includes(query));
  }

  insertMention(user: any) {
    try {
      const quill = this.editor.getQuill();
      const range = quill.getSelection(true);
      const userName = user.loginName;

      // Get current text and cursor position
      const currentText = quill.getText();
      const cursorPosition = range.index;

      // Find the @ symbol position
      const textBeforeCursor = currentText.substring(0, cursorPosition);
      const atSymbolPosition = textBeforeCursor.lastIndexOf("@");

      if (atSymbolPosition === -1) return;

      // Delete from @ to current cursor
      const deleteLength = cursorPosition - atSymbolPosition;
      quill.deleteText(atSymbolPosition, deleteLength);

      // Insert mention and space
      const mentionHtml = `<span class="mention-tag" 
        data-user-id="${user._id}" 
        data-user-name="${userName}" 
        contenteditable="false"
        style="background-color: #aab6b1; color: #0d3133; border-radius: 12px; padding: 2px 6px; font-weight: 500; display: inline-block;">
      ${userName}
    </span> `;

      quill.clipboard.dangerouslyPasteHTML(atSymbolPosition, mentionHtml, "user");

      // IMPORTANT: Manually set selection after inserting mention
      const newPosition = atSymbolPosition + mentionHtml.length;
      quill.setSelection(newPosition, 0, "silent");

      this.showUserList = false;
      this.mentionQuery = "";

      if (!this.mentionedUsers.find((m) => m.id === user._id)) {
        this.mentionedUsers.push({ id: user._id, name: userName });
      }

      // Force editor to update its internal state
      setTimeout(() => {
        quill.update("user");
      }, 0);
    } catch (err) {
      console.error("insertMention error:", err);
    }
  }
  onMentionClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target && target.textContent?.startsWith("@")) {
      this.showUserList = true;
      this.mentionQuery = "";
      this.filteredUsers = this.users;
    } else {
      this.showUserList = false;
    }
  }
}
