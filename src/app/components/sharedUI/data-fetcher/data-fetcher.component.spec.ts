import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataFetcherComponent } from './data-fetcher.component';

describe('DataFetcherComponent', () => {
  let component: DataFetcherComponent;
  let fixture: ComponentFixture<DataFetcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataFetcherComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataFetcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
