import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovalRequestListComponent } from './approval-request-list.component';

describe('ApprovalRequestListComponent', () => {
  let component: ApprovalRequestListComponent;
  let fixture: ComponentFixture<ApprovalRequestListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalRequestListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovalRequestListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
