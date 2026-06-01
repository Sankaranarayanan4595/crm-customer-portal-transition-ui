import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommentsOpportunityComponent } from './comments-opportunity.component';

describe('CommentsOpportunityComponent', () => {
  let component: CommentsOpportunityComponent;
  let fixture: ComponentFixture<CommentsOpportunityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentsOpportunityComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommentsOpportunityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
