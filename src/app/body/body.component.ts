import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { FileDataService } from '../services/file-data.service';
import { Log, LogConverterService } from '../services/logconverter.service';
import { DxDataGridComponent } from 'devextreme-angular';
import { UploadService } from '../services/upload.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DragAndDropService } from '../services/dragAndDrop.service';
import * as deMessages from 'devextreme/localization/messages/de.json';
import { loadMessages, locale } from 'devextreme/localization';
import {
  DxDataGridModule,
  DxTemplateModule,
  DxButtonModule,
  DxTabPanelModule,
  DxTabsModule,
  DxTextBoxModule,
  DxSelectBoxModule,
} from 'devextreme-angular';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

loadMessages(deMessages);
locale('de');

interface RowDataEvent {
  row: {
    data: Log;
  };
}

interface LogRow {
  Datum: string | Date;
  Uhrzeit: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-body',
  standalone: true,
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
  imports: [
    CommonModule,
    DxDataGridModule,
    DxTemplateModule,
    DxButtonModule,
    DxTabPanelModule,
    DxTabsModule,
    DxTextBoxModule,
    DxSelectBoxModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
  ],
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
  zipContents: File[] = [];
  selectedFileName = '';
  fileLogsMap: Record<string, Log[]> = {};
  isDragging = false;
  selectedIndex = 0;
  showUploadForm = true;
  fileUploaded = false;
  tabs: {
    title: string;
    isNew: boolean;
    zipFile: File | null;
    zipContents: File[];
    selectedFileName: string;
    fileLogsMap: Record<string, Log[]>;
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
  searchText = '';
  selectedRowKeys: string[] = [];
  currentIndex = -1;
  highlightedLogs: string[] = [];

  constructor(
    protected fileDataService: FileDataService,
    protected logConverter: LogConverterService,
    protected uploadService: UploadService,
    protected DragAndDropService: DragAndDropService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {
    this.logsDataSource = logConverter.getLogs();
    this.setHeaderFilter = this.setHeaderFilter.bind(this);
  }

  sanitizeText(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  onSelectionChanged(e: { selectedRowKeys: string[] }): void {
    this.selectedRowKeys = e.selectedRowKeys;
  }

  async loadFiles(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement.files || inputElement.files.length === 0) return;

    const fileList: FileList = inputElement.files;

    try {
      const { txtFiles, logs, fileLogsMap } =
        await this.uploadService.processFiles(fileList);
      this.txtFilesLoaded.emit(txtFiles);

      const currentTab = this.tabs[this.selectedIndex];
      currentTab.isNew = false;
      currentTab.zipFile = null;
      currentTab.zipContents = txtFiles;
      currentTab.fileLogsMap = fileLogsMap;
      currentTab.logsDataSource = logs;
      this.logsDataSource = logs;

      if (fileList.length === 1) {
        const file = fileList[0];
        if (file.name.endsWith('.zip')) {
          currentTab.title = file.name.replace(/\.zip$/, '');
        } else if (file.name.endsWith('.txt')) {
          currentTab.title = file.name;
        }
      } else if (txtFiles.length > 1) {
        currentTab.title = `TXT-Dateien (${this.getFormattedDate()})`;
      }

      this.onFileSelectionChange(null);
    } finally {
      inputElement.value = '';
    }
  }

  private getFormattedDate(): string {
    const currentDate = new Date();
    return currentDate.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  getFileName(file: File): string {
    return (
      file.name.split('/').pop() || file.name.split('\\').pop() || file.name
    );
  }

  resetGrid(logGrid: DxDataGridComponent): void {
    if (!logGrid || !logGrid.instance) {
      return;
    }

    logGrid.instance.clearSelection();
    logGrid.instance.clearFilter();
    logGrid.instance.state({});
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
  }

  addTab(): void {
    const baseTitle = 'Neuer Tab';

    const maxTabs = 7;
    if (this.tabs.length >= maxTabs) {
      const userConfirmed = window.confirm(
        'Der erste Tab wird gelöscht, um Platz für einen neuen Tab zu schaffen. Möchten Sie fortfahren?'
      );
      if (!userConfirmed) {
        return;
      }
      this.tabs.shift();
    }

    this.tabs.push({
      title: baseTitle,
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

    this.DragAndDropService.handleDrop(event, (result) => {
      this.txtFilesLoaded.emit(result.txtFiles);

      const currentTab = this.tabs[this.selectedIndex];
      currentTab.isNew = false;
      currentTab.zipFile = result.txtFiles[0];
      currentTab.zipContents = result.txtFiles;
      currentTab.fileLogsMap = result.fileLogsMap;
      currentTab.logsDataSource = result.logs;
      this.logsDataSource = result.logs;

      if (
        result.txtFiles.length === 1 &&
        result.txtFiles[0].name.endsWith('.zip')
      ) {
        const folderName = result.txtFiles[0].name.replace(/\.zip$/, '');
        currentTab.title = folderName;
      } else if (
        result.txtFiles.length === 1 &&
        result.txtFiles[0].name.endsWith('.txt')
      ) {
        currentTab.title = result.txtFiles[0].name;
      } else if (result.txtFiles.length > 1) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        currentTab.title = `TXT-Dateien (${formattedDate})`;
      }

      this.onFileSelectionChange(null);
    });
  }

  setHeaderFilter(event: RowDataEvent): void {
    const rowData = event.row.data as unknown as LogRow;

    this.logGrid.instance.clearFilter();

    if (this.logGrid?.instance && rowData) {
      let date = rowData.Datum;
      if (typeof date === 'string') {
        const parts = date.split('.');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          date = new Date(year, month, day);
        }
      }

      let time = rowData.Uhrzeit;
      if (time && typeof time === 'string') {
        const timeParts = time.split(':');
        if (timeParts.length >= 2) {
          time = `${timeParts[0].padStart(2, '0')}:${timeParts[1].padStart(
            2,
            '0'
          )}:`;
        }
      }

      this.logGrid.instance.columnOption('Datum', 'filterValue', date);
      this.logGrid.instance.columnOption('Uhrzeit', 'filterValue', time);
      this.logGrid.instance.refresh();
    }
  }
}
