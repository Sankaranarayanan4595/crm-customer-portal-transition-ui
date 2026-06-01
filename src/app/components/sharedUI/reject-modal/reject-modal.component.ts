import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
@Component({
    selector: 'app-reject-modal',
    imports: [ButtonModule,DialogModule,InputTextModule],
    templateUrl: './reject-modal.component.html',
    styleUrl: './reject-modal.component.scss'
})
export class RejectModalComponent {
  @Output() dismissMdl = new EventEmitter<boolean>(false);
  dismissMdlFn(){
    this.dismissMdl.emit(true);
  }
}
