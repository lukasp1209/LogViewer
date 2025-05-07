import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BodyComponent } from './body.component';
import { FileDataService } from '../services/file-data.service';
import { LogConverterService } from '../services/logconverter.service';
import { UploadService } from '../services/upload.service';
import { DragAndDropService } from '../services/dragAndDrop.service';
import { ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

describe('BodyComponent', () => {
  let component: BodyComponent;
  let fixture: ComponentFixture<BodyComponent>;
  let mockFileDataService: jasmine.SpyObj<FileDataService>;
  let mockLogConverterService: jasmine.SpyObj<LogConverterService>;
  let mockUploadService: jasmine.SpyObj<UploadService>;
  let mockDragAndDropService: jasmine.SpyObj<DragAndDropService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;

  beforeEach(() => {
    mockFileDataService = jasmine.createSpyObj('FileDataService', []);
    mockLogConverterService = jasmine.createSpyObj('LogConverterService', [
      'getLogs',
    ]);
    mockUploadService = jasmine.createSpyObj('UploadService', ['processFiles']);
    mockDragAndDropService = jasmine.createSpyObj('DragAndDropService', [
      'handleDrop',
    ]);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', [
      'detectChanges',
    ]);
    mockSanitizer = jasmine.createSpyObj('DomSanitizer', [
      'bypassSecurityTrustHtml',
    ]);

    TestBed.configureTestingModule({
      declarations: [BodyComponent],
      providers: [
        { provide: FileDataService, useValue: mockFileDataService },
        { provide: LogConverterService, useValue: mockLogConverterService },
        { provide: UploadService, useValue: mockUploadService },
        { provide: DragAndDropService, useValue: mockDragAndDropService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        { provide: DomSanitizer, useValue: mockSanitizer },
      ],
    });

    fixture = TestBed.createComponent(BodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default tabs', () => {
    expect(component.tabs.length).toBe(1);
    expect(component.tabs[0].title).toBe('Neuer Tab');
  });

  it('should sanitize text using DomSanitizer', () => {
    const unsafeText = '<script>alert("XSS")</script>';
    component.sanitizeText(unsafeText);
    expect(mockSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(
      unsafeText
    );
  });

  it('should add a new tab', () => {
    component.addTab();
    expect(component.tabs.length).toBe(2);
    expect(component.tabs[1].title).toBe('Neuer Tab');
  });

  it('should close a tab', () => {
    component.addTab();
    component.closeTab(1);
    expect(component.tabs.length).toBe(1);
  });

  it('should emit txtFilesLoaded when files are loaded', async () => {
    const mockEvent = {
      target: {
        files: [new File(['content'], 'test.txt', { type: 'text/plain' })],
      },
    } as unknown as Event;

    mockUploadService.processFiles.and.returnValue(
      Promise.resolve({
        txtFiles: [new File(['content'], 'test.txt', { type: 'text/plain' })],
        logs: [],
        fileLogsMap: {},
      })
    );

    spyOn(component.txtFilesLoaded, 'emit');
    await component.loadFiles(mockEvent);

    expect(component.txtFilesLoaded.emit).toHaveBeenCalledWith([
      new File(['content'], 'test.txt', { type: 'text/plain' }),
    ]);
  });

  it('should handle drag over event', () => {
    const mockEvent = new DragEvent('dragover');
    spyOn(mockEvent, 'preventDefault');
    spyOn(mockEvent, 'stopPropagation');

    component.onDragOver(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging).toBeTrue();
  });

  it('should handle drag leave event', () => {
    const mockEvent = new DragEvent('dragleave');
    spyOn(mockEvent, 'preventDefault');
    spyOn(mockEvent, 'stopPropagation');

    component.onDragLeave(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging).toBeFalse();
  });

  it('should handle drop event', () => {
    const mockEvent = new DragEvent('drop');
    spyOn(mockEvent, 'preventDefault');
    spyOn(mockEvent, 'stopPropagation');

    mockDragAndDropService.handleDrop.and.callFake((event, onSuccess) => {
      return Promise.resolve(
        onSuccess({
          txtFiles: [new File(['content'], 'test.txt', { type: 'text/plain' })],
          logs: [],
          fileLogsMap: {},
        })
      );
    });

    component.onDrop(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging).toBeFalse();
    expect(component.tabs[0].zipContents.length).toBe(1);
  });
});
