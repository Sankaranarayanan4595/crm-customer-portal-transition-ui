import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsatResponseComponent } from './csat-response.component';

describe('CsatResponseComponent', () => {
  let component: CsatResponseComponent;
  let fixture: ComponentFixture<CsatResponseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsatResponseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CsatResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
