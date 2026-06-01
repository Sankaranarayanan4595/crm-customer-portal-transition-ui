import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientApprovalSettingsComponent } from './client-approval-settings.component';

describe('ClientApprovalSettingsComponent', () => {
  let component: ClientApprovalSettingsComponent;
  let fixture: ComponentFixture<ClientApprovalSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientApprovalSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientApprovalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
