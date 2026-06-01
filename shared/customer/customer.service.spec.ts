import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";

jest.unmock("@angular/common/http");

import { CustomerService } from "./customer.service";
import { environment } from "../../environments/environment";

describe("CustomerService", () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CustomerService],
    });

    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getCompany()", async () => {
    const mockResponse = [{ id: 1 }];

    service.getCompany().then((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${environment.CRM_ApiUrl}/customerService/getCompanieslist`
    );

    expect(req.request.method).toBe("GET");

    req.flush(mockResponse);
  });

  it("should call createLeadFollowup()", () => {
    const payload = { name: "test" };

    service.createLeadFollowup(payload).subscribe((res) => {
      expect(res).toEqual({ success: true });
    });

    const req = httpMock.expectOne(
      `${environment.CRM_ApiUrl}/customerService/createLeadFollowup`
    );

    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual(payload);

    req.flush({ success: true });
  });

  it("should call getViews()", () => {
    const mockResponse = [{ name: "View1" }];

    service.getViews().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      `${environment.CRM_ApiUrl}/customerService/getViews`
    );

    expect(req.request.method).toBe("GET");

    req.flush(mockResponse);
  });
});