import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  DataTableComponent,
} from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";

@Component({
  selector: "app-table-preview",
  imports: [DataTableComponent],
  templateUrl: "./table-preview.component.html",
  styleUrl: "./table-preview.component.scss"
})
export class TablePreviewComponent {
  @Output() hideTablePreview = new EventEmitter<any>();
  @Input() fileData: any;
  action_fields = {
    delete: false,
    edit: false,
    viewdocument: false,
    userprofile: false,
  };

  position = "last";
  columnStatus = {
    show: false,
    header: ["Status"],
  };
  image_colum = {
    show: false,
    header: "Global",
    url: "../../assets/icons/download.png",
  };
  // !data table actions
  recive_data(_data: any) {
    // if (data.type == "delete") {
    //   this.deleteData(data.data);
    // }
  }
  button_colum = {};
  tablePreviewBackFn() {
    this.hideTablePreview.emit(false);
  }
}
