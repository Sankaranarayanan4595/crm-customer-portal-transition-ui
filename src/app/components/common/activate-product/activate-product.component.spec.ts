import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActivateProductComponent } from './activate-product.component';

describe('ActivateProductComponent', () => {
  let component: ActivateProductComponent;
  let fixture: ComponentFixture<ActivateProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivateProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActivateProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
