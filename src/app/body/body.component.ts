import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FileDataService } from 'src/app/services/file-data.service';
import { Log, LogConverterService } from '../services/logconverter.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { UploadService } from '../services/upload.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DragAndDropService } from '../services/dragAndDrop.service';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent {
  @Output() txtFilesLoaded = new EventEmitter<File[]>();
  @ViewChild('markedContentElement') markedContentElement:
    | ElementRef
    | undefined;
  @ViewChild(DxDataGridComponent, { static: false })
  logGrid!: DxDataGridComponent;
  @Output() searchEvent = new EventEmitter<string>();

  logsDataSource: Log[] = [];
  hoveredTabIndex: number | null = null;
  hoveredRowIndex: number | null = null;
  zipFile: File | null = null;
  zipContents: Array<File> = [];
  selectedFileName: string = '';
  fileLogsMap: { [key: string]: Log[] } = {};
  isDragging = false;
  selectedIndex = 0;
  showUploadForm: boolean = true;
  fileUploaded: boolean = false;
  tabs: {
    title: string;
    isNew: boolean;
    zipFile: File | null;
    zipContents: File[];
    selectedFileName: string;
    fileLogsMap: { [key: string]: Log[] };
    logsDataSource: Log[];
  }[] = [
    {
      title: 'Neuer Tab',
      isNew: true,
      zipFile: null,
      zipContents: [],
      selectedFileName: '',
      fileLogsMap: {},
      logsDataSource: [],
    },
  ];
  searchText: string = '';
  selectedRowKeys: any[] = [];
  currentIndex: number = -1;
  highlightedLogs: string[] = [];

  constructor(
    protected fileDataService: FileDataService,
    protected logConverter: LogConverterService,
    protected uploadService: UploadService,
    protected DragAndDropService: DragAndDropService,
    private cdr: ChangeDetectorRef
  ) {
    this.logsDataSource = logConverter.getLogs();
  }

  ngAfterViewInit(): void {
    if (!this.logGrid) {
      console.error('logGrid is not initialized.');
    } else {
      console.log('logGrid initialized successfully.');
    }
  }

  onSelectionChanged(e: any): void {
    this.selectedRowKeys = e.selectedRowKeys;
  }

  async loadFiles(event: any): Promise<void> {
    const fileList: FileList = event.target.files;
    if (fileList.length === 0) return;

    try {
      const { txtFiles, logs, fileLogsMap } =
        await this.uploadService.processFiles(fileList);
      this.txtFilesLoaded.emit(txtFiles);

      const currentTab = this.tabs[this.selectedIndex];
      currentTab.isNew = false;
      currentTab.zipFile = fileList[0];
      currentTab.zipContents = txtFiles;
      currentTab.fileLogsMap = fileLogsMap;
      currentTab.logsDataSource = logs;
      this.logsDataSource = logs;

      currentTab.title = fileList[0].name.replace(/\.zip$/, '');

      this.onFileSelectionChange(null);
    } catch (error) {
      console.error('Error processing files:', error);
    }
  }

  resetGrid(logGrid: DxDataGridComponent): void {
    if (!logGrid || !logGrid.instance) {
      console.warn('logGrid is not initialized or instance is undefined.');
      return;
    }

    logGrid.instance.clearSelection();
    logGrid.instance.clearFilter();
  }

  onFileSelectionChange(selectedFile: string | null = null): void {
    const currentTab = this.tabs[this.selectedIndex];

    if (!selectedFile && currentTab.zipContents.length > 0) {
      selectedFile = currentTab.zipContents[0].name;
    }

    currentTab.selectedFileName = selectedFile || '';

    if (selectedFile && currentTab.fileLogsMap[selectedFile]) {
      currentTab.logsDataSource = currentTab.fileLogsMap[selectedFile].slice(
        0,
        1000000
      );
      this.logsDataSource = currentTab.logsDataSource;
    } else {
      currentTab.logsDataSource = [];
      this.logsDataSource = [];
    }
    console.log(`File selection changed to: ${selectedFile}`);
  }

  applyFilter(column: string, value: string): void {
    if (this.logGrid?.instance) {
      this.logGrid.instance.filter([column, '=', value]);
      console.log(`Filter applied: ${column} = ${value}`);
    } else {
      console.warn('logGrid instance is not available.');
    }
  }

  addTab(): void {
    let baseTitle = 'Neuer Tab';
    let newTitle = baseTitle;
    let counter = 1;

    const maxTabs = 7;
    if (this.tabs.length >= maxTabs) {
      this.tabs.shift();
    }

    while (this.tabs.some((tab) => tab.title === newTitle)) {
      newTitle = `${baseTitle} ${counter}`;
      counter++;
    }

    this.tabs.push({
      title: newTitle,
      isNew: true,
      zipFile: null,
      zipContents: [],
      selectedFileName: '',
      fileLogsMap: {},
      logsDataSource: [],
    });

    this.selectedIndex = this.tabs.length - 1;
    this.cdr.detectChanges();
  }

  closeTab(index: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    this.tabs.splice(index, 1);

    if (this.selectedIndex >= this.tabs.length) {
      this.selectedIndex = this.tabs.length - 1;
    }

    if (this.tabs.length === 0) {
      this.addTab();
    }

    this.cdr.detectChanges();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    this.isDragging = false;

    this.DragAndDropService.handleDrop(
      event,
      (result) => {
        this.txtFilesLoaded.emit(result.txtFiles);

        const currentTab = this.tabs[this.selectedIndex];
        currentTab.isNew = false;
        currentTab.zipFile = result.txtFiles[0];
        currentTab.zipContents = result.txtFiles;
        currentTab.fileLogsMap = result.fileLogsMap;
        currentTab.logsDataSource = result.logs;
        this.logsDataSource = result.logs;

        currentTab.title = result.txtFiles[0].name.replace(/\.zip$/, '');

        this.onFileSelectionChange(null);
      },
      (error) => {
        console.error('Error processing files:', error);
      }
    );
  }
}
