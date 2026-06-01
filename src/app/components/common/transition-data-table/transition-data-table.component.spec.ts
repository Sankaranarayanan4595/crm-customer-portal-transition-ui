import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionDataTableComponent } from './transition-data-table.component';

describe('TransitionDataTableComponent', () => {
  let component: TransitionDataTableComponent;
  let fixture: ComponentFixture<TransitionDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionDataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
