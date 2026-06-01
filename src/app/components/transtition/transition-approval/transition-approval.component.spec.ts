import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TransitionApprovalComponent } from './transition-approval.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ChangeDetectorRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { BbStoreService, BBToastService, BBLoaderService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { SettingsService } from 'projects/customer-management-ui/shared/settings.service';
import { CategoriesService } from 'projects/customer-management-ui/shared/categories/categories.service';
import { TransitionService } from 'projects/customer-management-ui/shared/transition/transition.service';
import { CustomerService } from 'projects/customer-management-ui/shared/customer/customer.service';
import { ExcelService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/lib/shared/data-table/excel.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('TransitionApprovalComponent', () => {
  let component: TransitionApprovalComponent;
  let fixture: ComponentFixture<TransitionApprovalComponent>;

  const mockBbStore = {
    getItem: jest.fn().mockImplementation((key) => {
      if (key === 'timeZoneKey') return 'Asia/Kolkata';
      if (key === 'dateFormatkey') return 'mm/dd/yyyy';
      return 'mock-value';
    })
  };

  const mockTransitionService = {
    loadApprovalTransitionRequest: jest.fn().mockReturnValue(of({ data: [] }))
  };

  const mockCategoryService = {
    getUsers: jest.fn().mockResolvedValue([])
  };

  const mockCustomerService = {
    recategoryid: 'cat123'
  };

  const mockBbToaster = {
    show_success: jest.fn(),
    show_error: jest.fn(),
    show_info: jest.fn()
  };

  const mockBbLoader = {
    showLoader: jest.fn(),
    hideLoader: jest.fn()
  };

  const mockSettingsService = {
    currencyWithAmount: jest.fn().mockReturnValue('$100')
  };

  const mockRouter = {
    navigate: jest.fn()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionApprovalComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: BbStoreService, useValue: mockBbStore },
        { provide: Router, useValue: mockRouter },
        { provide: TransitionService, useValue: mockTransitionService },
        { provide: CategoriesService, useValue: mockCategoryService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: BBToastService, useValue: mockBbToaster },
        { provide: BBLoaderService, useValue: mockBbLoader },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: ExcelService, useValue: { exportToCsv: jest.fn() } },
        { provide: Clipboard, useValue: { copy: jest.fn() } },
        { provide: ChangeDetectorRef, useValue: { detectChanges: jest.fn(), markForCheck: jest.fn() } }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TransitionApprovalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and load data on ngOnInit', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(component.TransitionForm).toBeDefined();
    expect(mockTransitionService.loadApprovalTransitionRequest).toHaveBeenCalled();
  }));

  it('should handle search filter', fakeAsync(() => {
    component.rawData = [{ AccountId: '1', accountName: 'Test', transition_logs: [{}] }];
    component.TransitionForm.patchValue({ accountName: '1' });
    
    component.onAllSearch();
    tick();
    
    expect(component.filteredListItems.length).toBe(1);
  }));

  it('should navigate to view transition', () => {
    const mockRow = { _id: '123', transition_completed: true };
    component.ViewTranstion(mockRow);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/transition/view-transition'], expect.any(Object));
  });

  it('should handle form clear', fakeAsync(() => {
    component.TransitionForm.patchValue({ accountName: '1' });
    component.clearForm();
    tick();
    expect(component.TransitionForm.get('accountName')?.value).toBeNull();
  }));
});
