import { Routes } from '@angular/router';
import { BBAuthGuard, BBRoleGuard } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
const customer = 'customer';

export const customerPortalTransition: Routes = [
  {
    path: `${customer}/transition`,
    title: 'Customer Portal',
    loadComponent: () => {
      return import("./transition-dashboard-customer-portal/transition-dashboard-customer-portal.component")
        .then((m) => {
          return m.TransitionDashboardCustomerPortalComponent;
        })
        .catch((error) => {
          console.error("Error loading CustomerDashboardComponent:", error);
          throw error;
        });
    },
    canActivate: [BBAuthGuard, BBRoleGuard],
  },
  {
    path: `${customer}/transition-settings`,
    title: 'Customer Portal',
    loadComponent: () => {
      return import("./client-approval-settings/client-approval-settings.component")
        .then((m) => {
          return m.ClientApprovalSettingsComponent;
        })
        .catch((error) => {
          console.error("Error loading CustomerDashboardComponent:", error);
          throw error;
        });
    },
    canActivate: [BBAuthGuard, BBRoleGuard],
  },
];

