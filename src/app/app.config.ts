import { ApplicationConfig, ErrorHandler, importProvidersFrom, provideZoneChangeDetection } from "@angular/core";
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy, provideRouter } from "@angular/router";
import { LucideAngularModule, icons } from "lucide-angular";
import { routes } from "./app.routes";
import { LocationStrategy, PathLocationStrategy } from "@angular/common";
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { BBAuthInterceptor, BBErrorInterceptor } from "../../../CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { NgxDaterangepickerMd } from "ngx-daterangepicker-material";
import { NgMultiSelectDropDownModule } from "ng-multiselect-dropdown";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { SocketIoConfig, SocketIoModule } from "ngx-socket-io";
import { environment } from "projects/customer-management-ui/environments/environment";
import { providePrimeNG } from "primeng/config";
import AbgPreset from "projects/CommonLibrary-UI/BBLayout-mongo/src/lib/utility/abg-preset";
import { provideDaterangepickerLocale } from "ngx-daterangepicker-bootstrap";
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CrmSocketService } from "projects/customer-management-ui/shared/crm-socket/crm-socket.service";
import { ConfirmationService, MessageService } from "primeng/api";
import { GlobalErrorHandler } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
class MyStrategy extends RouteReuseStrategy {
  shouldDetach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }
  store(_route: ActivatedRouteSnapshot, _detachedTree: DetachedRouteHandle): void { }
  shouldAttach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }
  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(_future: ActivatedRouteSnapshot, _curr: ActivatedRouteSnapshot): boolean {
    return false;
  }
}
const config: SocketIoConfig = {
  url: environment.socketUrl, // Use your actual WebSocket server URL
  options: {
    path: "/authService/socket.io/", // Ensure this matches the server path
    transports: ["websocket"], // Force WebSocket transport
    secure: true, // Ensure secure connections
    reconnection: true, // Automatically reconnect if disconnected
    reconnectionAttempts: 10,
    reconnectionDelay: 5000,
  },
};
// const config_crm: SocketIoConfig = {
//   url: environment.crm_socket, // Use your actual WebSocket server URL
//   options: {
//     path: "/CRMService/socket.io/", // Ensure this matches the server path
//     transports: ["websocket"], // Force WebSocket transport
//     secure: true, // Ensure secure connections
//     reconnection: true, // Automatically reconnect if disconnected
//     reconnectionAttempts: 10,
//     reconnectionDelay: 5000,
//   },
// };
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideDaterangepickerLocale({
      separator: '/',
      applyLabel: 'Okay',
    }),
    importProvidersFrom(
      NgxDaterangepickerMd.forRoot(),
      NgMultiSelectDropDownModule.forRoot(),
      SocketIoModule.forRoot(config),
    ),
    CrmSocketService,
    ConfirmationService,
    MessageService,
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: BBAuthInterceptor,
      multi: true,
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: BBErrorInterceptor,
      multi: true,
    },
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    { provide: RouteReuseStrategy, useClass: MyStrategy },
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimations(),
    NgbActiveModal,
    providePrimeNG({
      theme: {
        preset: AbgPreset,
        options: {
          darkModeSelector: "light",
        },
      },
    }),
    provideAnimationsAsync(),
    importProvidersFrom(LucideAngularModule.pick(icons)),
  ],
};
