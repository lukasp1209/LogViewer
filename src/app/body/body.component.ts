// body.component.ts

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
    protected logLevelService: LogLevelService
  ) {}

  zipFile: File | null = null;
  zipContents: Array<File> = [];
  fileContentMap: { [fileName: string]: string } = {};
  originalFileContentMap: { [fileName: string]: string } = {};
  selectedFileName: string = '';
  loggedInUser: string | null = null;
  hiddenLines: boolean = false;
  customWord: string = '';
  searchQuery: string = '';
  selectedDeleteOptions: string[] = [];
  showUploadForm: boolean = true;
  contentStyle: { [key: string]: string } = {};
  fileUploaded: boolean = false;
  selectedFilters: string[] = [];

  logLevelToggle: boolean = false;

  hiddenLinesMap: { [fileName: string]: string[] } = {};

  logs: any;
  html: any;

  dropdownList: any = [];
  selectedItems: any = [];
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
                this.fileContentMap[fileName] = text;
                this.originalFileContentMap[fileName] = text;
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

      if ((this.logLevelToggle = false)) {
        this.undoMarkLogLevel();
      } else {
        this.markLogLevel();
      }
    }
  }

  markedContent(fileName: string): string {
    let content = this.fileContentMap[fileName] || '';
    return content;
  }

  ngOnInit() {
    this.dropdownList = [
      { item_id: 1, item_text: 'Wlan' },
      { item_id: 2, item_text: 'Bluetooth' },
      { item_id: 3, item_text: 'Engine' },
      { item_id: 4, item_text: 'Spam' },
    ];
    this.selectedItems = [];
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
        this.logHandlerService.onCheckboxChange('Wlan');
        break;
      case 'Bluetooth':
        this.logHandlerService.onCheckboxChange('Bluetooth');
        break;
      case 'Engine':
        this.logHandlerService.onCheckboxChange('Engine');
        break;
      case 'Spam':
        this.logHandlerService.onCheckboxChange('Spam');
        break;
      default:
        if (this.customWord) {
          this.removeCustomLines();
        }
        break;
    }
  }

  onSelectAll(items: any) {
    console.log(items);
  }

  removeCustomLines(): void {
    this.filterService.removeCustomLines(
      this.customWord,
      this.selectedFileName,
      this.fileContentMap,
      this.hiddenLinesMap,
      this.dropdownList,
      this.selectedItems
    );
    this.customWord = '';
  }

  restoreHiddenLines(): void {
    this.filterService.restoreHiddenLines(
      this.customWord,
      this.selectedFileName,
      this.fileContentMap,
      this.originalFileContentMap,
      this.hiddenLinesMap,
      this.dropdownList,
      this.selectedItems
    );
  }

  onItemDeSelect(item: any): void {
    if (item.item_text === this.customWord) {
      this.restoreHiddenLines();
    }
  }

  onDeSelectAll(): void {
    // Restore all hidden lines
    Object.keys(this.hiddenLinesMap).forEach(key => {
      if (this.selectedFileName === key) {
        this.restoreHiddenLines();
      }
    });
  }

  markLogLevel(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.LogLevel
    ) {
      this.fileContentMap[this.selectedFileName] =
        this.logLevelService.markLogLevel(
          this.fileContentMap[this.selectedFileName]
        );
      console.log(this.fileContentMap[this.selectedFileName]);
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
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] =
        this.logLevelService.undoMarkLogLevel(
          this.fileContentMap[this.selectedFileName]
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
      this.fileContentMap[this.selectedFileName] = this.originalFileContentMap[this.selectedFileName] || '';
      return;
    }
  
    const lines = this.originalFileContentMap[this.selectedFileName]?.split('\n') || [];
  
    const filteredLines = lines.filter(line =>
      line.toLowerCase().includes(searchTerm)
    );
  
    const highlightedLines = filteredLines.map(line =>
      line.replace(new RegExp(`\\b${searchTerm}\\b`, 'gi'), match =>
        `<span class="bg-warning">${match}</span>`
      )
    );
  
    this.fileContentMap[this.selectedFileName] = highlightedLines.join('\n');
  }
}