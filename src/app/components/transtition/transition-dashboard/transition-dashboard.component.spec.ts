import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionDashboardComponent } from './transition-dashboard.component';

describe('TransitionDashboardComponent', () => {
  let component: TransitionDashboardComponent;
  let fixture: ComponentFixture<TransitionDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
