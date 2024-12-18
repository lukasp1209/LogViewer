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
import { ExportService } from '../export/export.service';
import { Log, LogConverterService } from '../LogConverter/logconverter.service';

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
    protected highlightingService: HighlightingService,
    protected exportService: ExportService,
    protected logConverter: LogConverterService
  ) {
    this.logs = logConverter.getLogs();
  }

  logs: Log[] = [];

  zipFile: File | null = null;
  zipContents: Array<File> = [];
  selectedFileName: string = '';
  loggedInUser: string | null = null;
  customWord: string = '';
  searchQuery: string = '';
  selectedSimpleSearchTerm: string = '';
  showUploadForm: boolean = true;
  fileUploaded: boolean = false;
  selectedDateTime: Date | null = null;
  startDate: string = '';
  endDate: string = '';
  logData: { date: string; time: string; logLevel: string; message: string }[] =
    [];
  filteredLogs: Array<{
    date: string;
    time: string;
    level: string;
    message: string;
  }> = [];

  logLevelToggle: boolean = false;

  dropdownSettings: IDropdownSettings = {};

  ngOnInit() {
    this.initializeDropdownSettings();

    this.logHandlerService.loadFilterConfig().subscribe((config) => {
      this.fileDataService.selectedItems = [];
      this.initializeDropdownList(config, this.fileDataService.dropdownList);
    });

    this.logHandlerService.loadMarkConfig().subscribe((config) => {
      this.fileDataService.markSelectedItems = [];
      this.initializeDropdownList(
        config,
        this.fileDataService.markDropdownList,
        true
      );
    });
  }

  private initializeDropdownSettings(): void {
    this.dropdownSettings = {
      singleSelection: false,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Alles auswählen',
      unSelectAllText: 'Alles entfernen',
      itemsShowLimit: 3,
      allowSearchFilter: true,
    };
  }

  private initializeDropdownList(
    config: { [key: string]: any },
    targetList: any[],
    includeTerms: boolean = false
  ): void {
    let itemId = 1;
    for (const key in config) {
      if (config.hasOwnProperty(key)) {
        const item: any = {
          item_id: itemId++,
          item_text: key,
        };
        if (includeTerms) {
          item.terms = config[key];
        }
        targetList.push(item);
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

      this.resetDropdownItems();

      zip
        .loadAsync(this.zipFile)
        .then((zipData) => {
          const txtFiles: File[] = [];
          Object.keys(zipData.files).forEach((fileName) => {
            if (fileName.endsWith('.txt')) {
              zipData.files[fileName].async('text').then((text) => {
                const file = new File([new Blob([text])], fileName);
                txtFiles.push(file);

                this.fileDataService.originalFileContentMap[fileName] = text;

                const formattedLogs = this.logConverter.parseLogs(text);
                this.fileDataService.fileContentMap[fileName] = formattedLogs;

                console.log(`Formatted Logs for ${fileName}:`, formattedLogs);
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

      this.logLevelProof();
    }
  }

  resetDropdownItems(): void {
    this.fileDataService.selectedItems = [];
    this.fileDataService.markSelectedItems = [];

    if (this.selectedFileName) {
      this.fileDataService.fileContentMap[this.selectedFileName] =
        this.fileDataService.originalFileContentMap[this.selectedFileName];
    }

    this.logLevelProof();
  }

  markedContent(fileName: string): string {
    return this.fileDataService.fileContentMap[fileName] || '';
  }

  onItemSelect(item: any) {
    console.log(item);
    const filters = this.logHandlerService.filterConfig[item.item_text];
    if (filters) {
      this.filterService.removeLines(filters, this.selectedFileName);
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
      }
    });

    if (this.fileDataService.selectedItems.length === 0 && this.customWord) {
      this.removeCustomLines();
    }
    this.logLevelProof();
  }

  onDeSelectAll(): void {
    this.fileDataService.fileContentMap[this.selectedFileName] =
      this.fileDataService.originalFileContentMap[this.selectedFileName];
    this.fileDataService.selectedItems = [];

    this.logLevelProof();
  }

  highlightLogs(): void {
    const selectedTopics = this.fileDataService.selectedTopics;
    const fileName = this.selectedFileName;

    if (selectedTopics && selectedTopics.length > 0 && fileName) {
      this.highlightingService.highlightLogs(selectedTopics, fileName);
    } else {
      console.error('Kein Thema oder Dateiname ausgewählt.');
    }

    this.logLevelProof();
  }

  onMarkSelectAll(): void {
    const allItems = Object.keys(this.logHandlerService.markConfig);

    this.fileDataService.markSelectedItems = allItems.map((item) => ({
      item_text: item,
      terms: this.logHandlerService.markConfig[item] || [],
    }));

    const fileName = this.selectedFileName;
    if (fileName) {
      this.fileDataService.fileContentMap[fileName] =
        this.fileDataService.originalFileContentMap[fileName];

      this.highlightingService.highlightLogs(allItems, fileName);

      this.fileDataService.fileContentMap[fileName] =
        this.fileDataService.fileContentMap[fileName]
          .split('\n')
          .filter((line) =>
            allItems.some((term) =>
              line.toLowerCase().includes(term.toLowerCase())
            )
          )
          .join('\n');

      this.logLevelProof();
    }
  }

  onMarkDeSelectAll(): void {
    const fileName = this.selectedFileName;

    if (fileName) {
      this.fileDataService.fileContentMap[fileName] =
        this.fileDataService.originalFileContentMap[fileName];

      this.fileDataService.markSelectedItems = [];

      this.logLevelProof();
    }
  }

  onDropdownChange(): void {
    const selectedItems = this.fileDataService.markSelectedItems;
    const fileName = this.selectedFileName;

    if (!fileName) {
      return;
    }

    const allTerms: string[] = selectedItems.flatMap(
      (item) => this.logHandlerService.markConfig[item.item_text] || []
    );

    this.fileDataService.fileContentMap[fileName] =
      this.fileDataService.originalFileContentMap[fileName];

    if (selectedItems && selectedItems.length > 0) {
      this.highlightingService.highlightLogs(
        selectedItems.map((item) => item.item_text),
        fileName
      );

      this.fileDataService.fileContentMap[fileName] =
        this.fileDataService.fileContentMap[fileName]
          .split('\n')
          .filter((line) =>
            allTerms.some((term) =>
              line.toLowerCase().includes(term.toLowerCase())
            )
          )
          .join('\n');
    } else {
      this.fileDataService.fileContentMap[fileName] =
        this.fileDataService.originalFileContentMap[fileName];
    }
    this.logLevelProof();
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

  logLevelProof() {
    if (!this.logLevelToggle) {
      this.undoMarkLogLevel();
    } else {
      this.markLogLevel();
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
  }

  filterLogs(originalLogs: string[]): void {
    this.filteredLogs = originalLogs.map((log) => {
      const [date, time, levelWithMessage] = log.split(' ', 3);
      const level = levelWithMessage.replace(/[\[\]:]/g, '');
      const message = log.split(': ').slice(1).join(': ');
      return { date, time, level, message };
    });
  }

  exportCurrentContent(): void {
    this.exportService.exportFile('content', 'FilteredLogs');
  }
}
