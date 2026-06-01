import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsatSurveyComponent } from './csat-survey.component';

describe('CsatSurveyComponent', () => {
  let component: CsatSurveyComponent;
  let fixture: ComponentFixture<CsatSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CsatSurveyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CsatSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
