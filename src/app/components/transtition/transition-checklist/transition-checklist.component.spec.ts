import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionChecklistComponent } from './transition-checklist.component';

describe('TransitionChecklistComponent', () => {
  let component: TransitionChecklistComponent;
  let fixture: ComponentFixture<TransitionChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionChecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
