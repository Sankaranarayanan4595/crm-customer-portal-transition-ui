import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionTasksComponent } from './transition-tasks.component';

describe('TransitionTasksComponent', () => {
  let component: TransitionTasksComponent;
  let fixture: ComponentFixture<TransitionTasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionTasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
