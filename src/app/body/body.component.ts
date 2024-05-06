// body.component.ts
import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  SimpleChanges,
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
              });
            }
          });
          this.txtFilesLoaded.emit(txtFiles);
          this.zipContents = txtFiles;
          if (this.zipContents.length > 0) {
            this.selectedFileName = this.zipContents[0].name;
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

  // onCheckboxChange(filterType: keyof typeof this.logHandlerService.buttonStates): void {
  //   this.logHandlerService.onCheckboxChange(filterType);
  // }

  // show Content
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
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 5,
      allowSearchFilter: true,
    };
  }
  onItemSelect(item: any) {
    console.log(item);
    // if (item.item_text) {
    //   this.onCheckboxChange(item.item_text);
    // }
    switch (item.item_text) {
      case 'wlan':
        this.logHandlerService.onWlanCheckboxChange();
        break;
      case 'Bluetooth':
        this.logHandlerService.onBluetoothCheckboxChange();
        break;
      case 'Engine':
        this.logHandlerService.onEngineCheckboxChange();
        break;
      case 'Spam':
        this.logHandlerService.onSpamCheckboxChange();
        break;
      default:
        break;
    }
  }

  test() {
    this.onWlanCheckboxChange();
  }

  onSelectAll(items: any) {
    console.log(items);
  }

  //Wlan-Button
  deleteWlanLog(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.Wlan
    ) {
      this.fileContentMap[this.selectedFileName] =
        this.filterService.applyFilters(
          this.fileContentMap[this.selectedFileName],
          this.logHandlerService.wlanFilters
        );
    }
  }

  onWlanCheckboxChange(): void {
    if (this.logHandlerService.buttonStates.Wlan) {
      this.deleteWlanLog();
    }
  }

  // Bluetooth- Filter
  deleteBluetoothLog(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.Bluetooth
    ) {
      this.fileContentMap[this.selectedFileName] =
        this.filterService.applyFilters(
          this.fileContentMap[this.selectedFileName],
          this.logHandlerService.bluetoothFilters
        );
    }
  }
  onBluetoothCheckboxChange(): void {
    if (this.logHandlerService.buttonStates.Bluetooth) {
      this.deleteBluetoothLog();
    }
  }

  // Engine- Filter
  deleteEngineLog(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.Engine
    ) {
      this.fileContentMap[this.selectedFileName] =
        this.filterService.applyFilters(
          this.fileContentMap[this.selectedFileName],
          this.logHandlerService.engineFilters
        );
    }
  }
  onEngineCheckboxChange(): void {
    if (this.logHandlerService.buttonStates.Engine) {
      this.deleteEngineLog();
    }
  }

  // delete Spam and unnecessary Content
  deleteSpam(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.Spam
    ) {
      this.fileContentMap[this.selectedFileName] =
        this.filterService.applyFilters(
          this.fileContentMap[this.selectedFileName],
          this.logHandlerService.spamFilters
        );
    }
  }
  onSpamCheckboxChange(): void {
    if (this.logHandlerService.buttonStates.Spam) {
      this.deleteSpam();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['buttonStates'] && !changes['buttonStates'].firstChange) {
      this.deleteWlanLog();
    }
  }

  // Mission close
  markCmd(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.Finish
    ) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[
        this.selectedFileName
      ].replace(/\b(cmd=remove)\b/gi, (match) => `<mark>${match}</mark>`);
    }
  }
  onFinishCheckboxChange(): void {
    if (!this.logHandlerService.buttonStates.Finish) {
      this.removeMarkCmd();
    } else {
      this.markCmd();
    }
  }

  removeMarkCmd(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[
        this.selectedFileName
      ].replace(/<mark>(.*?)<\/mark>/gi, (match, content) => content);
    }
  }

  // create Mission
  createMission(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.logHandlerService.buttonStates.Mission
    ) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[
        this.selectedFileName
      ].replace(
        /\b(Generating NIDA ID)\b/gi,
        (match) => `<mark>${match}</mark>`
      );
    }
  }
  onMissionCheckboxChange(): void {
    if (!this.logHandlerService.buttonStates.Mission) {
      this.removeMissionMark();
    } else {
      this.createMission();
    }
  }

  removeMissionMark(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[
        this.selectedFileName
      ].replace(/<mark>(.*?)<\/mark>/gi, (match, content) => content);
    }
  }

  // custom Filters
  removeCustomLines(): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.customWord
    ) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[
        this.selectedFileName
      ]
        .split('\n')
        .filter(
          (line) => !new RegExp(`\\b.*${this.customWord}.*\\b`, 'gi').test(line)
        )
        .join('\n');
    }
    this.customWord = '';
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
}
