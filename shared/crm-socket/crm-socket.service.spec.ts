import { TestBed } from '@angular/core/testing';

import { CrmSocketService } from './crm-socket.service';

describe('CrmSocketService', () => {
  let service: CrmSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CrmSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
