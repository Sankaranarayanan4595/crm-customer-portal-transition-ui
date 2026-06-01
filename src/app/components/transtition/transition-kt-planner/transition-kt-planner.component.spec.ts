import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionKtPlannerComponent } from './transition-kt-planner.component';

describe('TransitionKtPlannerComponent', () => {
  let component: TransitionKtPlannerComponent;
  let fixture: ComponentFixture<TransitionKtPlannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionKtPlannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionKtPlannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
