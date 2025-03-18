import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import * as JSZip from 'jszip';
import { FileDataService } from 'src/app/FileData/file-data.service';
import { Log, LogConverterService } from '../LogConverter/logconverter.service';
import { DxDataGridComponent } from 'devextreme-angular';

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

  constructor(
    protected fileDataService: FileDataService,
    protected logConverter: LogConverterService,
    private cdr: ChangeDetectorRef
  ) {
    this.logsDataSource = logConverter.getLogs();
  }

  findNext(): void {}
  findPrevious(): void {}

  onSelectionChanged(e: any): void {
    this.selectedRowKeys = e.selectedRowKeys;
  }

  loadFiles(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.zipContents = [];
      const zip = new JSZip();
      const txtFiles: File[] = [];
      const logs: Log[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.name.endsWith('.zip')) {
          this.zipFile = file;
          zip
            .loadAsync(this.zipFile)
            .then((zipData) => {
              Object.keys(zipData.files).forEach((fileName) => {
                if (fileName.endsWith('.txt')) {
                  zipData.files[fileName].async('text').then((text) => {
                    const extractedFile = new File(
                      [new Blob([text])],
                      fileName
                    );
                    txtFiles.push(extractedFile);

                    this.fileDataService.originalFileContentMap[fileName] =
                      text;
                    const parsedLogs = this.logConverter.parseLogs(text);
                    logs.push(...parsedLogs);

                    this.fileLogsMap[fileName] =
                      this.logConverter.parseLogs(text);
                    this.updateGridData(logs);
                  });
                }
              });
            })
            .then(() => {
              if (txtFiles.length > 0) {
                this.selectedFileName = txtFiles[0].name;
                this.onFileSelectionChange(this.selectedFileName);
              }
            })
            .catch((error) => {
              console.error('Fehler beim Laden der ZIP-Datei:', error);
            });
        } else if (file.name.endsWith('.txt')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const text = e.target?.result as string;
            this.fileDataService.originalFileContentMap[file.name] = text;
            txtFiles.push(file);
            const parsedLogs = this.logConverter.parseLogs(text);
            logs.push(...parsedLogs);
            this.fileLogsMap[file.name] = parsedLogs;
            this.updateGridData(logs);

            if (txtFiles.length > 0) {
              this.selectedFileName = txtFiles[0].name;
              this.onFileSelectionChange(this.selectedFileName);
            }
          };
          reader.readAsText(file);
        }
      }

      this.txtFilesLoaded.emit(txtFiles);
      this.zipContents = txtFiles;

      if (this.tabs.length === 0 || this.selectedIndex < 0) {
        let tabTitle = this.zipFile
          ? this.zipFile.name.replace(/\.zip$/, '')
          : 'Upload';

        this.tabs = [
          {
            title: tabTitle,
            isNew: false,
            zipFile: this.zipFile,
            zipContents: [...txtFiles],
            selectedFileName: txtFiles.length > 0 ? txtFiles[0].name : '',
            fileLogsMap: { ...this.fileLogsMap },
            logsDataSource: [...logs],
          },
        ];
        this.selectedIndex = 0;
      } else {
        let currentTab = this.tabs[this.selectedIndex];
        currentTab.isNew = false;
        currentTab.zipFile = this.zipFile;
        currentTab.zipContents = [...txtFiles];
        currentTab.selectedFileName =
          txtFiles.length > 0 ? txtFiles[0].name : '';
        currentTab.fileLogsMap = { ...this.fileLogsMap };
        currentTab.logsDataSource = [...logs];

        if (this.zipFile) {
          currentTab.title = this.zipFile.name.replace(/\.zip$/, '');
        }
      }

      if (this.tabs[this.selectedIndex].selectedFileName) {
        this.onFileSelectionChange(
          this.tabs[this.selectedIndex].selectedFileName
        );
      }
    }
  }

  updateGridData(logs: Log[]): void {
    this.logsDataSource = [...logs.slice(0, 1000)];
    this.resetGrid(this.logGrid);
  }

  onFileSelectionChange(selectedFile: string): void {
    if (selectedFile && this.fileLogsMap[selectedFile]) {
      this.logsDataSource = this.fileLogsMap[selectedFile].slice(0, 1000);
    } else {
      this.logsDataSource = [];
    }
    this.resetGrid(this.logGrid);
  }

  resetGrid(logGrid: DxDataGridComponent): void {
    logGrid.instance.clearSelection();
    logGrid.instance.clearFilter();
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

    const maxTabs = 10;
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
  closeButtonHandler(tab: any) {
    const index = this.tabs.indexOf(tab);

    if (index !== -1) {
      this.tabs.splice(index, 1);
    }

    if (this.selectedIndex >= this.tabs.length && this.selectedIndex > 0) {
      this.selectedIndex = this.tabs.length - 1;
    }
  }

  showCloseButton() {
    return this.tabs.length > 1;
  }
}
