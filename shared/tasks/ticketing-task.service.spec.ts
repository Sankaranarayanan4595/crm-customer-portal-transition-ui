import { TestBed } from '@angular/core/testing';

import { TicketingTaskService } from './ticketing-task.service';

describe('TicketingTaskService', () => {
  let service: TicketingTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketingTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
