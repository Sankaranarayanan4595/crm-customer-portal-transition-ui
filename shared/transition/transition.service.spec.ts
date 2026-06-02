import { TestBed } from "@angular/core/testing";

import { TransitionService } from "./transition.service";

import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe("TransitionService", () => {
  let service: TransitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TransitionService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
