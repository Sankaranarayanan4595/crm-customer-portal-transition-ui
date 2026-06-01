import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsatScoreComponent } from './csat-score.component';

describe('CsatScoreComponent', () => {
  let component: CsatScoreComponent;
  let fixture: ComponentFixture<CsatScoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsatScoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CsatScoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
