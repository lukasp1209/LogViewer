import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';
import { Log, LogConverterService } from '../LogConverter/logconverter.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { UploadService } from '../services/upload.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  private searchResults: { index: number; log: Log }[] = [];
  private currentSearchIndex: number = -1;

  constructor(
    protected fileDataService: FileDataService,
    protected logConverter: LogConverterService,
    protected uploadService: UploadService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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

      // Aktualisieren der globalen Logs-Datenquelle
      this.logsDataSource = logs;

      currentTab.title = fileList[0].name.replace(/\.zip$/, '');

      if (currentTab.selectedFileName) {
        this.onFileSelectionChange(currentTab.selectedFileName);
      }
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

  onFileSelectionChange(selectedFile: string): void {
    const currentTab = this.tabs[this.selectedIndex];
    currentTab.selectedFileName = selectedFile;

    if (selectedFile && currentTab.fileLogsMap[selectedFile]) {
      currentTab.logsDataSource = currentTab.fileLogsMap[selectedFile].slice(
        0,
        1000
      );
      this.logsDataSource = currentTab.logsDataSource;
    } else {
      currentTab.logsDataSource = [];
      this.logsDataSource = [];
    }

    this.resetGrid(this.logGrid);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files.length) {
      const file = event.dataTransfer.files[0];
      this.loadFiles({ target: { files: [file] } });
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

  updateSearchResults(): void {
    console.log('Search text:', this.searchText);
    console.log('Logs data source:', this.logsDataSource);

    this.searchResults = [];
    if (!this.searchText) {
      console.log('Search text is empty. Clearing search results.');
      this.currentSearchIndex = -1;
      return;
    }

    this.logsDataSource.forEach((log, index) => {
      const logString = JSON.stringify(log).toLowerCase();
      if (logString.includes(this.searchText.toLowerCase())) {
        this.searchResults.push({ index, log });
      }
    });

    console.log('Search Results:', this.searchResults);
    console.log('Total matches found:', this.searchResults.length);

    this.currentSearchIndex = this.searchResults.length > 0 ? 0 : -1;
  }

  highlightText(text: string): SafeHtml {
    if (!this.searchText || !text) return text;

    const escapedSearch = this.escapeRegex(this.searchText);
    const regex = new RegExp(`(${escapedSearch})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  onSearchTextChange(): void {
    console.log('Search text changed:', this.searchText);
    this.updateSearchResults();

    if (this.logGrid?.instance) {
      this.logGrid.instance.refresh();
    }
  }

  clearSearchText(): void {
    this.searchText = '';
    this.logGrid.instance.refresh();
  }

  findNext(): void {
    if (this.searchResults.length === 0) {
      console.log('No search results available to navigate.');
      return;
    }

    this.currentSearchIndex =
      (this.currentSearchIndex + 1) % this.searchResults.length;

    console.log('Moving to next result, index:', this.currentSearchIndex);
    this.scrollToCurrentSearchResult();
  }

  findPrevious(): void {
    if (this.searchResults.length === 0) {
      console.log('No search results available to navigate.');
      return;
    }

    this.currentSearchIndex =
      (this.currentSearchIndex - 1 + this.searchResults.length) %
      this.searchResults.length;

    console.log('Moving to previous result, index:', this.currentSearchIndex);
    this.scrollToCurrentSearchResult();
  }

  scrollToCurrentSearchResult(): void {
    const currentResult = this.searchResults[this.currentSearchIndex];
    if (currentResult && this.logGrid?.instance) {
      this.logGrid.instance.navigateToRow(currentResult.index);
      this.logGrid.instance.selectRowsByIndexes([currentResult.index]);
    }
  }

  closeTab(index: number, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.tabs.splice(index, 1);

    if (this.selectedIndex >= this.tabs.length) {
      this.selectedIndex = this.tabs.length - 1;
    }
    this.cdr.detectChanges();
  }
}
