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
import { FilterService } from 'src/app/filter/filter.service';
import { LogHandlerService } from '../log-handler/log-handler.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { LogLevelService } from '../log-level/log-level.service';
import { FileDataService } from 'src/app/FileData/file-data.service';
import { SearchService } from 'src/app/search/search.service';
import { HighlightingService } from '../highlight/highlighting.service';


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
    protected fileDataService: FileDataService,
    protected searchService: SearchService,
    protected highlightingService: HighlightingService
  ) {}

  zipFile: File | null = null;
  zipContents: Array<File> = [];
  selectedFileName: string = '';
  loggedInUser: string | null = null;
  customWord: string = '';
  searchQuery: string = '';
  selectedSimpleSearchTerm: string = '';
  showUploadForm: boolean = true;
  fileUploaded: boolean = false;

  logLevelToggle: boolean = false;

  dropdownSettings: IDropdownSettings = {};

  ngOnInit() {
    this.logHandlerService.loadFilterConfig().subscribe((config) => {
      this.initializeDropdownList(config);
      this.fileDataService.selectedItems = [];
      this.dropdownSettings = {
        singleSelection: false,
        idField: 'item_id',
        textField: 'item_text',
        selectAllText: 'Alles auswählen',
        unSelectAllText: 'Alles entfernen',
        itemsShowLimit: 3,
        allowSearchFilter: true,
      };
    });
  }

  initializeDropdownList(config: { [key: string]: any }) {
    let itemId = 1;
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        this.fileDataService.dropdownList.push({
          item_id: itemId++,
          item_text: key,
        });
      }
    }
  }  

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

  onItemSelect(item: any) {
    console.log(item);
    const filters = this.logHandlerService.filterConfig[item.item_text];
    if (filters) {
      this.filterService.removeLines(filters, this.selectedFileName);
      this.highlightLogs();
    } else if (this.customWord) {
      this.removeCustomLines();
    }
  }

  onSelectAll(items: any[]) {
    console.log(items);
    if (items.length === 0 && this.customWord) {
      this.removeCustomLines();
    } else {
      items.forEach((item) => {
        const filters = this.logHandlerService.filterConfig[item.item_text];
        if (filters) {
          this.filterService.removeLines(filters, this.selectedFileName);
        }
      });
      this.highlightLogs();
    }
  }

  onItemDeSelect(item: any): void {
    console.log('Item deselected:', item);
    console.log('Custom word:', this.customWord);

    this.fileDataService.fileContentMap[this.selectedFileName] =
      this.fileDataService.originalFileContentMap[this.selectedFileName];

    this.fileDataService.selectedItems =
      this.fileDataService.selectedItems.filter(
        (i: any) => i.item_id !== item.item_id
      );

    this.fileDataService.selectedItems.forEach((selectedItem: any) => {
      const filters =
        this.logHandlerService.filterConfig[selectedItem.item_text];
      if (filters) {
        this.filterService.removeLines(filters, this.selectedFileName);
      } else if (this.customWord) {
        this.removeCustomLines();
      }
    });

    if (!this.logLevelToggle) {
      this.undoMarkLogLevel();
    } else {
      this.markLogLevel();
    }

    this.highlightLogs();
  }

  onDeSelectAll(): void {
    this.fileDataService.fileContentMap[this.selectedFileName] =
      this.fileDataService.originalFileContentMap[this.selectedFileName];
    this.fileDataService.selectedItems = [];

    if (this.logLevelToggle) {
      this.markLogLevel();
    }
  }

  highlightLogs(): void {
    const selectedTerms = this.fileDataService.selectedItems.map((item: any) => item.item_text);
    this.highlightingService.highlightLogs(selectedTerms, this.selectedFileName);
  }

  removeCustomLines(): void {
    let customWords: string[] = [];

    if (typeof this.customWord === 'string') {
      customWords = [this.customWord];
    } else if (Array.isArray(this.customWord)) {
      customWords = this.customWord;
    }

    this.filterService.removeLines(customWords, this.selectedFileName);

    this.customWord = '';
  }

  restoreHiddenLines(): void {
    let customWords: string[] = [];

    if (typeof this.customWord === 'string') {
      customWords = [this.customWord];
    } else if (Array.isArray(this.customWord)) {
      customWords = this.customWord;
    }

    console.log('Restoring lines for custom words:', customWords);

    this.filterService.restoreHiddenLines(customWords, this.selectedFileName);

    this.customWord = '';
  }

  markTerms(terms: string[]) {
    let content =
      this.fileDataService.originalFileContentMap[this.selectedFileName];
    if (!content) return;

    terms.forEach((term) => {
      content = this.searchService.highlightTerm(content, term);
    });

    this.fileDataService.fileContentMap[this.selectedFileName] = content;
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
    if (
      this.selectedFileName &&
      this.fileDataService.fileContentMap[this.selectedFileName]
    ) {
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
    this.searchService.search(this.searchQuery, this.selectedFileName);

    if (!this.logLevelToggle) {
      this.undoMarkLogLevel();
    } else {
      this.markLogLevel();
    }
  }
}
