import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BodyComponent } from './body.component';
import { FileDataService } from 'src/app/services/file-data.service';
import { LogConverterService } from '../services/logconverter.service';
import { UploadService } from '../services/upload.service';
import { DragAndDropService } from '../services/dragAndDrop.service';

describe('BodyComponent', () => {
  let component: BodyComponent;
  let fixture: ComponentFixture<BodyComponent>;
  let uploadServiceMock: jest.Mocked<UploadService>;

  beforeEach(async () => {
    uploadServiceMock = {
      processFiles: jest.fn().mockResolvedValue({
        txtFiles: [new File(['log content'], 'test.txt')],
        logs: [
          { Datum: '2024-01-01', Uhrzeit: '10:00', Nachricht: 'Beispiel' },
        ],
        fileLogsMap: {
          'test.txt': [
            { Datum: '2024-01-01', Uhrzeit: '10:00', Nachricht: 'Beispiel' },
          ],
        },
      }),
    } as any;

    await TestBed.configureTestingModule({
      imports: [BodyComponent],
      providers: [
        { provide: FileDataService, useValue: {} },
        { provide: LogConverterService, useValue: { getLogs: () => [] } },
        { provide: UploadService, useValue: uploadServiceMock },
        { provide: DragAndDropService, useValue: { handleDrop: jest.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should add a new tab and increase tab count', () => {
    const initialLength = component.tabs.length;
    component.addTab();
    expect(component.tabs.length).toBe(initialLength + 1);
  });

  it('should load files and update logsDataSource', async () => {
    const mockEvent = {
      target: {
        files: [new File(['log content'], 'test.txt')],
      },
    } as any;

    await component.loadFiles(mockEvent);
    expect(component.logsDataSource.length).toBeGreaterThan(0);
    expect(component.tabs[component.selectedIndex].title).toBe('test.txt');
  });

  it('should change file selection and update logsDataSource', () => {
    const tab = component.tabs[0];
    tab.zipContents = [new File(['log content'], 'test.txt')];
    tab.fileLogsMap = {
      'test.txt': [
        {
          Datum: new Date('2024-01-01'),
          Uhrzeit: '10:00',
          Nachricht: 'Beispiel',
          Loglevel: 'INFO',
          Quelle: 'Test',
        },
      ],
    };

    component.onFileSelectionChange('test.txt');
    expect(component.logsDataSource.length).toBe(1);
    expect(tab.selectedFileName).toBe('test.txt');
  });

  it('should close tab and reselect the last index', () => {
    component.addTab();
    const tabCountBefore = component.tabs.length;
    component.closeTab(tabCountBefore - 1);
    expect(component.tabs.length).toBe(tabCountBefore - 1);
  });

  it('should sanitize text correctly', () => {
    const dirty = `<img src=x onerror=alert('xss')>`;
    const result = component.sanitizeText(dirty);
    expect(result).toBeTruthy();
  });

  it('should reset the grid properly', () => {
    const mockGrid = {
      instance: {
        clearSelection: jest.fn(),
        clearFilter: jest.fn(),
        state: jest.fn(),
      },
    } as any;

    component.resetGrid(mockGrid);
    expect(mockGrid.instance.clearSelection).toHaveBeenCalled();
    expect(mockGrid.instance.clearFilter).toHaveBeenCalled();
    expect(mockGrid.instance.state).toHaveBeenCalledWith({});
  });
});
