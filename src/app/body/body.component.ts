import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  OnInit,
} from '@angular/core';
import * as JSZip from 'jszip';
import { NgModel } from '@angular/forms';
import { FilterService } from 'src/app/service/filter.service';
import { LogHandlerService } from '../log-handler/log-handler.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { LogLevelService } from '../log-level/log-level.service';
import { FileDataService } from 'src/app/FileData/file-data.service';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss'],
})
export class BodyComponent implements OnInit {
  @Output() txtFilesLoaded = new EventEmitter<File[]>();
  @ViewChild('markedContentElement') markedContentElement:
    | ElementRef
    | undefined;
  @ViewChild('searchInput') searchInput!: NgModel;
  @Output() searchEvent = new EventEmitter<string>();

  constructor(
    protected logHandlerService: LogHandlerService,
    protected filterService: FilterService,
    protected logLevelService: LogLevelService,
    protected fileDataService: FileDataService
  ) {}

  zipFile: File | null = null;
  zipContents: Array<File> = [];
  selectedFileName: string = '';
  loggedInUser: string | null = null;
  customWord: string = '';
  searchQuery: string = '';
  showUploadForm: boolean = true;
  fileUploaded: boolean = false;

  logLevelToggle: boolean = false;

  logs: any;
  html: any;

  dropdownSettings = {};

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.fileUploaded = false;
      this.zipFile = fileList[0];
      document.title = `${this.zipFile.name}`;
      this.zipContents = [];
      const zip = new JSZip();
      zip
        .loadAsync(this.zipFile)
        .then((zipData) => {
          const txtFiles: File[] = [];
          Object.keys(zipData.files).forEach((fileName) => {
            if (fileName.endsWith('.txt')) {
              zipData.files[fileName].async('text').then((text) => {
                const file = new File([new Blob([text])], fileName);
                txtFiles.push(file);
                this.fileDataService.fileContentMap[fileName] = text;
                this.fileDataService.originalFileContentMap[fileName] = text;
              });
            }
          });
          this.txtFilesLoaded.emit(txtFiles);
          this.zipContents = txtFiles;
          if (this.zipContents.length > 0) {
            this.selectedFileName = this.zipContents[0].name;
            this.resetLogLevelToggle();
          }
          this.showUploadForm = false;
          this.fileUploaded = true;
        })
        .catch(() => {
          this.fileUploaded = false;
        });

      if (!this.logLevelToggle) {
        this.undoMarkLogLevel();
      } else {
        this.markLogLevel();
      }
    }
  }

  markedContent(fileName: string): string {
    return this.fileDataService.fileContentMap[fileName] || '';
  }

  ngOnInit() {
    this.fileDataService.dropdownList = [
      { item_id: 1, item_text: 'Wlan' },
      { item_id: 2, item_text: 'Bluetooth' },
      { item_id: 3, item_text: 'Engine' },
    ];
    this.fileDataService.selectedItems = [];
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Alles auswählen',
      unSelectAllText: 'Alles entfernen',
      itemsShowLimit: 5,
      allowSearchFilter: true,
    };
  }

  onItemSelect(item: any) {
    console.log(item);
    switch (item.item_text) {
          case 'Wlan':
            this.filterService.removeLines(this.logHandlerService.wlanFilters, this.selectedFileName);
            break;
          case 'Bluetooth':
            this.filterService.removeLines(this.logHandlerService.bluetoothFilters, this.selectedFileName);
            break;
          case 'Engine':
            this.filterService.removeLines(this.logHandlerService.engineFilters, this.selectedFileName);
            break;
            case 'Spam':
            this.filterService.removeLines(this.logHandlerService.spamFilters, this.selectedFileName);
            break;
      default:
        if (this.customWord) {
          this.removeCustomLines();
        }
        break;
    }
  }

  onSelectAll(items: any[]) {
    console.log(items);
    if (items.length === 0) {
      if (this.customWord) {
        this.removeCustomLines();
      }
    } else {
      items.forEach(item => {
        switch (item.item_text) {
          case 'Wlan':
            this.filterService.removeLines(this.logHandlerService.wlanFilters, this.selectedFileName);
            break;
          case 'Bluetooth':
            this.filterService.removeLines(this.logHandlerService.bluetoothFilters, this.selectedFileName);
            break;
          case 'Engine':
            this.filterService.removeLines(this.logHandlerService.engineFilters, this.selectedFileName);
            break;
            case 'Spam':
            this.filterService.removeLines(this.logHandlerService.spamFilters, this.selectedFileName);
            break;
          default:
            break;
        }
      });
    }
  }

  removeCustomLines(): void {
    let customWords: string[] = [];

    if (typeof this.customWord === 'string') {
      customWords = [this.customWord];
    } else if (Array.isArray(this.customWord)) {
      customWords = this.customWord;
    }
  
    this.filterService.removeLines(
      customWords,
      this.selectedFileName
    );
  
    this.customWord = '';
  }
  
  restoreHiddenLines(): void {
    let customWords: string[] = [];
  
    if (typeof this.customWord === 'string') {
      customWords = [this.customWord];
    } else if (Array.isArray(this.customWord)) {
      customWords = this.customWord;
    }
  
    this.filterService.restoreHiddenLines(
      customWords,
      this.selectedFileName
    );
  
    this.customWord = '';
  }
  

  onItemDeSelect(item: any): void {
    if (item.item_text === this.customWord) {
      this.restoreHiddenLines();
    }
  }

  onDeSelectAll(): void {
    Object.keys(this.fileDataService.hiddenLinesMap).forEach(key => {
      if (this.selectedFileName === key) {
        this.restoreHiddenLines();
      }
    });
  }

  markLogLevel(): void {
    if (
      this.selectedFileName &&
      this.fileDataService.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.LogLevel
    ) {
      this.fileDataService.fileContentMap[this.selectedFileName] =
        this.logLevelService.markLogLevel(
          this.fileDataService.fileContentMap[this.selectedFileName]
        );
      console.log(this.fileDataService.fileContentMap[this.selectedFileName]);
    }
  }

  onLogLevelToggleChange(): void {
    if (!this.logHandlerService.buttonStates.LogLevel) {
      this.undoMarkLogLevel();
      this.logLevelToggle = false;
    } else {
      this.markLogLevel();
      this.logLevelToggle = true;
    }
  }

  undoMarkLogLevel(): void {
    if (this.selectedFileName && this.fileDataService.fileContentMap[this.selectedFileName]) {
      this.fileDataService.fileContentMap[this.selectedFileName] =
        this.logLevelService.undoMarkLogLevel(
          this.fileDataService.fileContentMap[this.selectedFileName]
        );
    }
  }

  resetLogLevelToggle(): void {
    this.logHandlerService.buttonStates.LogLevel = false;
    this.undoMarkLogLevel();
    this.logLevelToggle = false;
  }

  search(): void {
    const searchTerm = this.searchQuery.toLowerCase().trim();
    
    if (!searchTerm) {
      this.fileDataService.fileContentMap[this.selectedFileName] = this.fileDataService.originalFileContentMap[this.selectedFileName] || '';
      return;
    }
  
    const lines = this.fileDataService.originalFileContentMap[this.selectedFileName]?.split('\n') || [];
  
    const filteredLines = lines.filter(line =>
      line.toLowerCase().includes(searchTerm)
    );
  
    const highlightedLines = filteredLines.map(line =>
      line.replace(new RegExp(`\\b${searchTerm}\\b`, 'gi'), match =>
        `<span class="bg-warning">${match}</span>`
      )
    );
  
    this.fileDataService.fileContentMap[this.selectedFileName] = highlightedLines.join('\n');
  }
}
