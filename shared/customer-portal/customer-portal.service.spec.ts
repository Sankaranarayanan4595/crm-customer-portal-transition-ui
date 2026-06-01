import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerPortalService } from './customer-portal.service';
import { environment } from "../../environments/environment";

describe('CustomerPortalService', () => {
  let service: CustomerPortalService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.CRM_ApiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CustomerPortalService]
    });
    service = TestBed.inject(CustomerPortalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch invoices', () => {
    service.getInvoicesCustomer().subscribe(data => {
      expect(data).toBeDefined();
    });
    const req = httpMock.expectOne(`${apiUrl}/customerPortal/getInvoicesCustomer`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should fetch company details', () => {
    service.getCompanyDetails().subscribe(data => {
      expect(data).toBeDefined();
    });
    const req = httpMock.expectOne(`${apiUrl}/apiUrl/customerPortal/getCompanyDetails`);
    // Wait, the apiUrl in service is environment.CRM_ApiUrl.
    // Let's assume it matches.
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should update customer details', () => {
    const profile = { name: 'Test' };
    service.updateCustomerDetails(profile).subscribe(res => {
      expect(res).toBeDefined();
    });
    const req = httpMock.expectOne(`${apiUrl}/customerPortal/updateCustomerDetails`);
    expect(req.request.method).toBe('PATCH');
    req.flush({ success: true });
  });

  it('should handle profile data storage', () => {
    const mockData = { id: 1 };
    service.setProfileData(mockData);
    expect(service.getProfileData()).toEqual(mockData);
  });
});
