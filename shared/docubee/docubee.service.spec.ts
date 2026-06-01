import { TestBed } from '@angular/core/testing';

import { DocubeeService } from './docubee.service';

describe('DocubeeService', () => {
  let service: DocubeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocubeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
