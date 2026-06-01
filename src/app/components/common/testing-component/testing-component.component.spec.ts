import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TestingComponentComponent } from './testing-component.component';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { BBLoaderService, BBToastService } from 'projects/CommonLibrary-UI/BBLayout-mongo/src/public-api';
import { CustomerService } from 'projects/customer-management-ui/shared/customer/customer.service';
import { MastersService } from 'projects/customer-management-ui/shared/masters/masters.service';
import { FormsService } from 'projects/BBForms-ui/src/public-api';
import { OpportunitiesService } from 'projects/customer-management-ui/shared/opportunities/opportunities.service';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('TestingComponentComponent', () => {
  let component: TestingComponentComponent;
  let fixture: ComponentFixture<TestingComponentComponent>;

  const mockMastersService = {
    getAllCRMAuditLogs: jest.fn().mockReturnValue(of({ data: [] })),
    syncAllProductsQuickbook: jest.fn().mockReturnValue(of({ message: 'Success' }))
  };

  const mockCustomerService = {
    SyncAllCustomerQuickbook: jest.fn().mockReturnValue(of({ message: 'Success' }))
  };

  const mockFormsService = {
    getFormsByID: jest.fn().mockReturnValue(of({ components: [] }))
  };

  const mockBbToaster = {
    show_success: jest.fn(),
    show_error: jest.fn()
  };

  const mockBbLoader = {
    showLoader: jest.fn(),
    hideLoader: jest.fn()
  };

  const mockOpportunitiesService = {
    uploadProductViaExcel: jest.fn().mockResolvedValue({ message: 'Success' }),
    ChangeCompanyStatus: jest.fn().mockResolvedValue({ message: 'Success' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestingComponentComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        FormBuilder,
        { provide: MastersService, useValue: mockMastersService },
        { provide: CustomerService, useValue: mockCustomerService },
        { provide: BBToastService, useValue: mockBbToaster },
        { provide: BBLoaderService, useValue: mockBbLoader },
        { provide: FormsService, useValue: mockFormsService },
        { provide: OpportunitiesService, useValue: mockOpportunitiesService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TestingComponentComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and fetch logs on ngOnInit', fakeAsync(() => {
    component.ngOnInit();
    tick();
    expect(mockFormsService.getFormsByID).toHaveBeenCalled();
    expect(mockMastersService.getAllCRMAuditLogs).toHaveBeenCalled();
  }));

  it('should apply filters correctly', async () => {
    component.rawData = [
      { collectionName: 'Users', originalData: {}, updatedData: {}, _id: '1', updatedBy: 'admin' },
      { collectionName: 'Items', originalData: {}, updatedData: {}, _id: '2', updatedBy: 'user' }
    ];
    component.filterForm.patchValue({ collection: 'Users', user: '0' });
    
    await component.applyFilter();
    
    expect(component.listItems.length).toBe(1);
    expect(component.listItems[0].collectionName).toBe('Users');
  });

  it('should reset filter', () => {
    component.rawData = [{ collectionName: 'Users', originalData: {}, updatedData: {}, _id: '1', updatedBy: 'admin' }];
    component.resetFilter();
    expect(component.filterForm.get('collection')?.value).toEqual(['0']);
    expect(component.listItems.length).toBe(1);
  });

  it('should sync products', fakeAsync(() => {
    component.syncProduct();
    tick();
    expect(mockMastersService.syncAllProductsQuickbook).toHaveBeenCalled();
    expect(mockBbToaster.show_success).toHaveBeenCalledWith('Success');
  }));

  it('should sync customers', fakeAsync(() => {
    component.syncCustomer();
    tick();
    expect(mockCustomerService.SyncAllCustomerQuickbook).toHaveBeenCalled();
    expect(mockBbToaster.show_success).toHaveBeenCalledWith('Success');
  }));

  it('should handle file upload', async () => {
    component.selectedFile = new File([''], 'test.xlsx');
    component.typeOfUpload = 'Products';
    
    await component.uploadFile();
    expect(mockOpportunitiesService.uploadProductViaExcel).toHaveBeenCalled();
    expect(component.message).toBe('Success');
  });

  it('should change company status', async () => {
    await component.ChangeCompanyStatus();
    expect(mockOpportunitiesService.ChangeCompanyStatus).toHaveBeenCalled();
    expect(component.changestatus).toBe('Success');
  });
});
