import { TestBed } from '@angular/core/testing';

import { LogConverterService } from './logconverter.service';

describe('ExportService', () => {
  let service: LogConverterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LogConverterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
