import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmTransitionPhasesComponent } from './crm-transition-phases.component';

describe('CrmTransitionPhasesComponent', () => {
  let component: CrmTransitionPhasesComponent;
  let fixture: ComponentFixture<CrmTransitionPhasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmTransitionPhasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrmTransitionPhasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
