import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManualEsignComponent } from './manual-esign.component';

describe('ManualEsignComponent', () => {
  let component: ManualEsignComponent;
  let fixture: ComponentFixture<ManualEsignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManualEsignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManualEsignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
