import { TestBed } from "@angular/core/testing";

import { MastersService } from "./masters.service";

import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("MastersService", () => {
  let service: MastersService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MastersService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
