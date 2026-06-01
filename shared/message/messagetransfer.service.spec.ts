import { TestBed } from '@angular/core/testing';

import { MessagetransferService } from './messagetransfer.service';

describe('MessagetransferService', () => {
  let service: MessagetransferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessagetransferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
