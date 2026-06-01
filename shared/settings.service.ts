import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { CustomerService } from "projects/customer-management-ui/shared/customer/customer.service";

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private customerService = inject(CustomerService);

  private decimalDigitSubject = new BehaviorSubject<number>(2);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);
  constructor() { }

  async loadDecimalDigit(): Promise<void> {
    try {
      const response = await firstValueFrom(this.customerService.getCompanyAdditionalSettingsById());
      const digit = Number(response?.data?.decimalDigit ?? 2);
      this.setDecimalDigit(digit);
    } catch (error) {
      console.error('Error loading decimal digit:', error);
    }
  }

  decimalDigit$ = this.decimalDigitSubject.asObservable();

  setDecimalDigit(value: number): void {
    this.decimalDigitSubject.next(value);
  }

  getDecimalDigit(): number {
    const val = this.decimalDigitSubject.getValue();
    return val;
  }
  getFormattedAmount(value: number): string {
    const digits = this.getDecimalDigit();
    const factor = Math.pow(10, digits);
    const truncated = Math.trunc(value * factor) / factor;
    const fixed = truncated.toFixed(digits);
    return Number(fixed).toString();
  }

  currencyWithAmount(symbol: string, amount: number): string {
    const decimalDigits = 2;

    // Determine locale based on currency symbol
    let locale = 'en-US';
    switch (symbol) {
      case '₹':
        locale = 'en-IN';
        break;
      case '£':
        locale = 'en-GB';
        break;
      case '€':
        locale = 'de-DE';
        break;
      case 'C$':
        locale = 'en-CA';
        break;
      default:
        locale = 'en-US';
    }

    // Format amount according to locale and decimal condition
    const formattedAmount = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    }).format(amount);
    if (amount === 0) {
      return `${symbol}0.00`;
    } else {
      return `${symbol}${formattedAmount}`;
    }
  }
}
