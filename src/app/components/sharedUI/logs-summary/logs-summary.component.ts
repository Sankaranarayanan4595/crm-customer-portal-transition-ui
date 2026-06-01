import { Component, Input, OnInit, inject } from "@angular/core";
import { BBLoaderService, BbStoreService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { InvoicesService } from "projects/customer-management-ui/shared/invoices/invoices.service";
import { MastersService } from "projects/customer-management-ui/shared/masters/masters.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-logs-summary",
  imports: [],
  templateUrl: "./logs-summary.component.html",
  styleUrl: "./logs-summary.component.scss",
})
export class LogsSummaryComponent implements OnInit {
  private invoiceService = inject(InvoicesService);
  private masterService = inject(MastersService);
  private bbStore = inject(BbStoreService);
  private bbLoader = inject(BBLoaderService);

  @Input()
  id!: string;
  logs: any[] = [];
  taxMasterData: any[] = [];
  defTimeZone: string = "Asia/Kolkata";
  totalLength!: number;
  paidStatus: boolean = false;
  countries: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  async ngOnInit() {
    this.defTimeZone = this.bbStore.getItem("timeZoneKey") || "Asia/Kolkata";
    await this.loadTax();
    await this.loadCountries();
    await this.loadGetInoviceLogById(this.id);
  }

  private async loadTax() {
    try {
      const taxResponse = await firstValueFrom(this.masterService.getAllTaxesBactive());
      this.taxMasterData = taxResponse?.data || [];
    } catch (error) {
      console.error("Error fetching tax details:", error);
    }
  }

  async loadCountries(): Promise<void> {
    try {
      this.bbLoader.showLoader();
      const country = await firstValueFrom(this.masterService.GetCountries());
      this.countries = country;
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async loadGetInoviceLogById(id: any) {
    try {
      this.bbLoader.showLoader();
      const logResponse = await firstValueFrom(this.invoiceService.getInoviceLogById(id));
      const allLogs = logResponse?.data || [];
      // console.log("allLogs: ", allLogs);
      this.totalLength = allLogs?.length - 1;
      this.paidStatus = allLogs[this.totalLength]?.log_name.includes("Invoice Paid") ? true : false;
      // const createdLog = allLogs.find((log: any) => log.log_name === "Invoice Created");
      // const baseData = createdLog?.updatedData?.invoiceDetails?.[0] || {};
      // const baseLineItems = baseData.lineItems || [];

      this.logs = allLogs.map((log: any) => {
        const dateObj = new Date(log.updatedAt);
        const date = dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        const time = new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: this.defTimeZone || "Asia/Kolkata",
        }).format(dateObj);

        const updatedItems = log.updatedData?.invoiceDetails || [];
        const oldItems = log.oldInvoiceDetails || [];
        const isEditLog = log.log_name?.includes("Invoice Edited");
        const changeDescriptions: any[] = [];
        if (isEditLog && oldItems?.length > 0 && updatedItems.length > 0) {
          updatedItems.forEach((newItem: any) => {
            const oldItem = oldItems.find((o: any) => o._id === newItem._id) || {};
            const label = newItem.productName || `Expense (${newItem.serviceName})` || "Line Item";

            const isNew = newItem.isNew;
            const isDeleted = newItem.isDeleted;
            const isEdited = newItem.isEdited;

            if (isNew) changeDescriptions.push({ label: `New ${label} Added : $${newItem.cValue}`, value: "" });
            if (isDeleted) changeDescriptions.push({ label: `${label} - Deleted`, value: "" });

            if (isEdited && !isDeleted) {
              this.compareDate(label, oldItem.cInvoice_Date, newItem.cInvoice_Date, changeDescriptions);
              this.compareTaxes(label, oldItem.oTax_Id, newItem.oTax_Id, this.taxMasterData, changeDescriptions);
              this.compareBillDiscount(label, log.originalData, log.updatedData, changeDescriptions);
              this.compareMessage(label, log.originalData, log.updatedData, changeDescriptions);
              this.compareBillingDetails(
                log.originalData?.billingDetails,
                log.updatedData?.billingDetails,
                changeDescriptions
              );
              if (!newItem.isFTE && !newItem.isSubscription) {
                this.compareValues(label, "Quantity", oldItem.iQty, newItem.iQty, changeDescriptions);
                this.compareValues(label, "Value", oldItem.cValue, newItem.cValue, changeDescriptions);
                this.compareValues(
                  label,
                  "Description",
                  oldItem.cDescription,
                  newItem.cDescription,
                  changeDescriptions
                );
                this.compareDiscount(label, oldItem, newItem, changeDescriptions);
              }

              if (newItem.isFTE || newItem.isSubscription) {
                newItem.lineItems?.forEach((line: any, i: number) => {
                  const oldLine = oldItem.lineItems?.[i] || {};
                  const typeLabel = `${label} (${line.cUserTypeName || "Unknown"})`;
                  if (line.isDeleted) {
                    changeDescriptions.push({ label: `${typeLabel} - Line Item Deleted`, value: `` });
                  } else {
                    this.compareValues(typeLabel, "Qty", oldLine.iQty, line.iQty, changeDescriptions);
                    this.compareValues(typeLabel, "Value", oldLine.cValue, line.cValue, changeDescriptions);
                    this.compareValues(
                      typeLabel,
                      "Description",
                      oldLine.cDescription,
                      line.cDescription,
                      changeDescriptions
                    );
                    this.compareDiscount(typeLabel, oldLine, line, changeDescriptions);
                    this.compareDate(typeLabel, oldLine.cInvoice_Date, line.cInvoice_Date, changeDescriptions);
                  }
                });
              }
            }
          });
        }
        this.compareTotal('Total changed', log.originalData, log.updatedData, changeDescriptions);

        return {
          timestamp: log?.isCompleted ? date : "",
          time_txt: log?.isCompleted ? time : "",
          title: `${log.log_name}${isEditLog ? ` - ${log?.newInvoiceDetails?.[0]?.productName || ""}` : ""}`,
          username: log?.isCompleted ? log.username || log.approver || "" : "",
          statusClass: log?.isCompleted ? "active" : "in-active",
          reason: log?.reason,
          changeDescription: changeDescriptions,
        };
      });
    } catch (error) {
      console.error("Error loading invoice logs:", error);
    } finally {
      this.bbLoader.hideLoader();
    }
  }

  async compareValues(label: string, field: string, oldVal: any, newVal: any, changes: any[]) {
    if (oldVal != newVal) {
      changes.push({ label: `${label} - ${field} changed`, value: `${oldVal} → ${newVal}` });
    }
  }

  async compareBillDiscount(label: string, oldItem: any, newItem: any, changes: any[]) {
    const oldDisc = oldItem.cDiscount ?? "0";
    const newDisc = newItem.cDiscount ?? "0";
    if (oldDisc != newDisc) {
      changes.push({
        label: `${label} - Bill Discount changed`,
        value: `${oldDisc}${oldItem.cDiscountUnit ?? "%"} → ${newDisc}${newItem.cDiscountUnit ?? "%"}`,
      });
    }
  }

  async compareDiscount(label: string, oldItem: any, newItem: any, changes: any[]) {
    const oldDisc = oldItem.cLineDiscount ?? "0";
    const newDisc = newItem.cLineDiscount ?? "0";
    if (oldDisc != newDisc) {
      changes.push({
        label: `${label} - Line Discount changed`,
        value: `${oldDisc}${oldItem.cLineDiscountUnit ?? "%"} → ${newDisc}${newItem.cLineDiscountUnit ?? "%"}`,
      });
    }
  }

  async compareDate(_label: string, oldDate: string, newDate: string, changes: any[]) {
    const o = oldDate?.substring(0, 10) ?? "";
    const n = newDate?.substring(0, 10) ?? "";
    if (o !== n) {
      changes.push({
        label: `${_label} - Invoice Date changed`,
        value: `${this.formatDate(o)} → ${this.formatDate(n)}`,
      });
    }
  }

  async compareMessage(_label: string, oldItem: any, newItem: any, changes: any[]) {
    const oldMsg = oldItem?.cMessage?.trim() || "";
    const newMsg = newItem?.cMessage?.trim() || "";

    if (!oldMsg && newMsg) {
      // Message added
      changes.push({
        label: `${_label} - Message Added:`,
        value: newMsg,
      });
    } else if (oldMsg && newMsg && oldMsg !== newMsg) {
      // Message changed
      changes.push({
        label: `${_label} - Message changed:`,
        value: `${oldMsg} → ${newMsg}`,
      });
    }
  }

  async compareTotal(_label: string, oldItem: any, newItem: any, changes: any[]) {
    const oldTotal = oldItem.cTotal ?? "0";
    const newTotal = newItem.cTotal ?? "0";
    if (oldTotal != newTotal) {
      changes.push({
        label: "Total changed",
        value: `${oldTotal} → ${newTotal}`,
      });
    }
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr?.split("-") || [];
    return `${day}/${month}/${year}`;
  }

  async compareTaxes(label: string, oldTax: any[], newTax: any[], masterData: any[], changes: any[]) {
    const normalize = (t: any) => (typeof t === "string" ? t : t._id);
    const oldIds = (oldTax || []).map(normalize);
    const newIds = (newTax || []).map(normalize);
    const added = newIds.filter((id) => !oldIds.includes(id));
    const removed = oldIds.filter((id) => !newIds.includes(id));

    if (added.length || removed.length) {
      const getLabel = (id: string) => {
        const tax = masterData?.find((t: any) => t._id === id || t.id === id);
        return tax?.taxAndType || `Tax ID: ${id}`;
      };
      const parts = [];
      if (removed.length) parts.push(`Removed: ${removed.map(getLabel).join(", ")}`);
      if (added.length) parts.push(`Added: ${added.map(getLabel).join(", ")}`);
      changes.push({ label: `${label} - Taxes Changed`, value: parts.join(" | ") });
    }
  }

  compareBillingDetails(oldBilling: any, newBilling: any, changes: any[]) {
    if (!oldBilling || !newBilling) return;

    const fieldsToCompare = [
      "cBilling_Address1",
      "cBilling_Address2",
      "cBilling_City",
      "cBilling_State",
      "cBilling_Country",
      "cBilling_Postal_Code",
    ];

    let hasChanged = false;

    for (const key of fieldsToCompare) {
      const oldVal = oldBilling?.[key]?.toString()?.trim() || "";
      const newVal = newBilling?.[key]?.toString()?.trim() || "";
      if (oldVal !== newVal) {
        hasChanged = true;
        break;
      }
    }

    if (hasChanged) {
      const getCountryName = (countryId: string): string => {
        const country = this.countries?.find((c: { _id: string }) => c._id === countryId);
        return country?.cCountry || countryId || "";
      };

      const formatAddress = (data: any): string => {
        const address1 = data?.cBilling_Address1 || "";
        const address2 = data?.cBilling_Address2 || "";
        const city = data?.cBilling_City || "";
        const state = data?.cBilling_State || "";
        const country = getCountryName(data?.cBilling_Country);
        const postal = data?.cBilling_Postal_Code || "";

        const line1 = [address1, address2, city].filter(Boolean).join(", ");
        const line2 = [state, country, postal].filter(Boolean).join(", ");

        return `${line1}<br>${line2}`;
      };

      const value = `<div class="address-change">
        <div class="address-section">
        <div class="address-label">Old:</div>
          <div class="address-value">${formatAddress(oldBilling)}</div>
        </div>
        <div class="address-section">
        <div class="address-label">New:</div>
          <div class="address-value">${formatAddress(newBilling)}</div>
        </div>
      </div>`;

      changes.push({
        label: "Billing Address Changed:",
        value: value,
      });
    }
  }
}
