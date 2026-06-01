import { layoutRoutes } from "./../../../CommonLibrary-UI/BBLayout-mongo/src/lib/bb-layout.routes";
import { userAdminRoutes } from "./../../../CommonLibrary-UI/BBUserAdmin-mongo/src/lib/user-admin.routes";
import { Routes } from "@angular/router";
import { errorRoutes } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { reportRoutes } from "projects/CommonLibrary-UI/report-builder-ui/src/public-api";
import { customerPortalTransition } from "./components/customerPortal/customerPortal.routes";
import { formsRouting } from 'projects/BBForms-ui/src/lib/bb-forms.routing';
 
export const routes: Routes = [
  ...errorRoutes,
  ...layoutRoutes,
  ...userAdminRoutes,
  ...formsRouting,
  ...customerPortalTransition,
  ...reportRoutes,
];

