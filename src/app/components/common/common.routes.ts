import { Routes } from "@angular/router";
import { ActivateProductComponent } from "./activate-product/activate-product.component";
import { BillingComponent } from "./billing/billing.component";
import { TestingComponentComponent } from "./testing-component/testing-component.component";
const ProductActivationBase = "product";

export const ProductActivation: Routes = [
  {
    path: `${ProductActivationBase}/activateProduct/:id`,
    component: ActivateProductComponent,
    //   canActivate: [BBAuthGuard, BBRoleGuard],
  },
  {
    path: `${ProductActivationBase}/billing/:id`,
    component: BillingComponent,
    //   canActivate: [BBAuthGuard, BBRoleGuard],
  },
  {
    path: `${ProductActivationBase}/superadmin`,
    component: TestingComponentComponent,
    //   canActivate: [BBAuthGuard, BBRoleGuard],
  },
];