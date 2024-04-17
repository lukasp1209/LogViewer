import { TestBed } from '@angular/core/testing';

import { MarkingService } from './marking.service';

describe('MarkingService', () => {
  let service: MarkingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarkingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
