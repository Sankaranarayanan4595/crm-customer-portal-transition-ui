import { Component } from '@angular/core';
// import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu } from 'primeng/menu';
@Component({
  selector: 'app-menu-transition',
  imports: [Menu, ButtonModule],
  templateUrl: './menu-transition.component.html',
  styleUrl: './menu-transition.component.scss'
})
export class MenuTransitionComponent {
  params!: ICellRendererParams;
  menuItems: MenuItem[] = [];

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.menuItems = [
      // {
      //   label: 'Change Template',
      //   icon: 'pi pi-file',
      //   command: () => this.handleAction('changeTemplate')
      // },
      // {
      //   label: 'Hold Transition',
      //   icon: 'pi pi-pause',
      //   command: () => this.handleAction('hold')
      // },
      // {
      //   label: 'Cancel Transition',
      //   icon: 'pi pi-times',
      //   command: () => this.handleAction('cancel')
      // },
      ...(this.params.data?.isNew ?
        [{
          label: "Start Transition",
          icon: "bi bi-arrow-right",
          command: () => this.onViewClick(),
        }] : []),

      ...(this.params.data?.["CSAT %"] && this.params.data?.["CSAT %"] !== ""
        ? [
          {
            label: "ReInitiate CSAT Survey",
            icon: "bi bi-ui-checks",
            command: () => this.handleAction("initiate"),
          },
        ]
        : [
          {
            label: "Initiate CSAT Survey",
            icon: "bi bi-ui-checks",
            disabled: !this.params.data?.transition_completed,
            command: () => this.handleAction("initiate"),
          },
        ]),
    ];


  }


  refresh(_params: ICellRendererParams): boolean {
    return false;
  }

  onViewClick(): void {
    if (this.params.data?.isNew) {
      (this.params.context.componentParent as any).unsavedmodal(
        (this.params.context.componentParent as any).unsavedChgModal,
        this.params.data
      );
    } else {
      (this.params.context.componentParent as any).ViewTranstion(this.params.data);
    }
  }

  handleAction(action: string): void {
    const parent = this.params.context?.componentParent;
    parent?.handleTransitionAction(this.params.data, action);
  }

  // private getActionLabel(action: string): string {
  //   const labels: Record<string, string> = {
  //     'changeTemplate': 'Change Template',
  //     'hold': 'Hold',
  //     'cancel': 'Cancel',
  //     'complete': 'Complete'
  //   };
  //   return labels[action] || action;
  // }
}