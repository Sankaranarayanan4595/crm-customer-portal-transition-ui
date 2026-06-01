import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KPITransitionComponent } from './kpi-transition.component';

describe('KPITransitionComponent', () => {
  let component: KPITransitionComponent;
  let fixture: ComponentFixture<KPITransitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KPITransitionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KPITransitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
