import { Injectable, ApplicationRef, inject } from "@angular/core";
import { Socket } from "ngx-socket-io";
import { environment } from "projects/customer-management-ui/environments/environment";

@Injectable({
  providedIn: "root",
})
export class CrmTransitionSocketService extends Socket {

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);


  constructor() {
    const appRef = inject(ApplicationRef);

    super({
      url: environment.crm_transition_socket || environment.crm_socket,
      options: {
        path: "/CRMTransitionService/socket.io/",
        transports: ["websocket"],
        secure: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 5000,
      }
    }, appRef);

    this.ioSocket.on("connect", () => {
      console.log("%c✅ CRM Transition Socket Connected", "color: green");
    });

    this.ioSocket.on("disconnect", () => {
      console.log("❌ CRM Transition Socket Disconnected");
    });

    this.ioSocket.on("connect_error", (err: any) => {
      console.error("❌ CRM Transition Socket Connection Error:", err);
    });
  }
}