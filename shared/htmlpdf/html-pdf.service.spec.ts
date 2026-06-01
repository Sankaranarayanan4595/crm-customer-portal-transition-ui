import { TestBed } from '@angular/core/testing';

import { HtmlPdfService } from './html-pdf.service';

describe('HtmlPdfService', () => {
  let service: HtmlPdfService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HtmlPdfService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
