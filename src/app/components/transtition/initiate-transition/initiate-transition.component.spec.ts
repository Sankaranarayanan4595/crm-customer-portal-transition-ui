import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InitiateTransitionComponent } from './initiate-transition.component';

describe('InitiateTransitionComponent', () => {
  let component: InitiateTransitionComponent;
  let fixture: ComponentFixture<InitiateTransitionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InitiateTransitionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InitiateTransitionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
