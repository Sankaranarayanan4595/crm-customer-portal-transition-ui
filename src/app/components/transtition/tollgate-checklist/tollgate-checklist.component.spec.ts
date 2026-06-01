import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TollgateChecklistComponent } from './tollgate-checklist.component';

describe('TollgateChecklistComponent', () => {
  let component: TollgateChecklistComponent;
  let fixture: ComponentFixture<TollgateChecklistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TollgateChecklistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TollgateChecklistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
