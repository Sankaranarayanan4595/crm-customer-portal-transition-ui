import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BsSingleDatepickerComponent } from './bs-single-datepicker.component';

describe('BsSingleDatepickerComponent', () => {
  let component: BsSingleDatepickerComponent;
  let fixture: ComponentFixture<BsSingleDatepickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BsSingleDatepickerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BsSingleDatepickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
