import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmPhasesMappingTemplatesComponent } from './crm-phases-mapping-templates.component';

describe('CrmPhasesMappingTemplatesComponent', () => {
  let component: CrmPhasesMappingTemplatesComponent;
  let fixture: ComponentFixture<CrmPhasesMappingTemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmPhasesMappingTemplatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrmPhasesMappingTemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
