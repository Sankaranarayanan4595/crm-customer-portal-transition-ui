import { TestBed } from '@angular/core/testing';

import { ContactCommunicationService } from './contact-communication.service';

describe('ContactCommunicationService', () => {
  let service: ContactCommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactCommunicationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
