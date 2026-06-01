import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionTabsComponent } from './transition-tabs.component';

describe('TransitionTabsComponent', () => {
  let component: TransitionTabsComponent;
  let fixture: ComponentFixture<TransitionTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
