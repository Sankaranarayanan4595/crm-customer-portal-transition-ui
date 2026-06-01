import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionDashboardCustomerPortalComponent } from './transition-dashboard-customer-portal.component';

describe('TransitionDashboardCustomerPortalComponent', () => {
  let component: TransitionDashboardCustomerPortalComponent;
  let fixture: ComponentFixture<TransitionDashboardCustomerPortalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionDashboardCustomerPortalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionDashboardCustomerPortalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
