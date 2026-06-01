import { TestBed } from '@angular/core/testing';

import { PaginationListService } from './pagination-list.service';

describe('PaginationListService', () => {
  let service: PaginationListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaginationListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
