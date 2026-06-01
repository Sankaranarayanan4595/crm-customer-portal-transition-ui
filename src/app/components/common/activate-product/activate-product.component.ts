import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BBLoaderService, BBToastService } from "projects/CommonLibrary-UI/BBLayout-mongo/src/public-api";
import { CommonService } from "projects/customer-management-ui/shared/common/common.service";
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-activate-product',
  imports: [],
  templateUrl: './activate-product.component.html',
  styleUrl: './activate-product.component.scss'
})
export class ActivateProductComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private commonService = inject(CommonService);
  private bbToaster = inject(BBToastService);
  private router = inject(Router);
  private bbLoader = inject(BBLoaderService);


  productId: string | null = null;
  productName: any;
  companyName: any;
  statusName: any;
  portalName: any;
  categoryName: any;
  redirectlink: any;

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() { }

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id');
    this.updateProductStatus(this.productId);
  }

  redirectToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
  private handleResponse(response: any) {
    this.productName = response.productName || "N/A";
    this.companyName = response.companyName || "N/A";
    this.portalName = response.portalName || "N/A";
    this.categoryName = response.categoryName || "N/A";
    this.statusName = response.statusName || "N/A";
    this.redirectlink = response.portalLink || "N/A";
  }
  async updateProductStatus(productId: any) {
    try {
      this.bbLoader.showLoader();
      const response = await firstValueFrom(this.commonService.updateProductStatus(productId));
      if (response.success) {
        this.bbToaster.show_success(response.message);
        this.handleResponse(response);
      }
      else {
        this.bbToaster.show_warn(response.message);
        this.handleResponse(response);
      }
    } catch (error) {
      this.bbToaster.show_error("Error updating product status.");
      console.error("error", error);
      // return false;
    } finally {
      this.bbLoader.hideLoader();
    }
  }
}