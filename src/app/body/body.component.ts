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
import { LogLevelService } from '../log-level/log-level.service';

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

        // if (this.logLevelToggle = false) {
        //   this.undoMarkLogLevel();
        // }
        // else {
        //   this.markLogLevel();
        // }
    }
  }

  onCheckboxChange(filterType: keyof typeof this.logHandlerService.buttonStates): void {
    this.logHandlerService.onCheckboxChange(filterType);
  }

  // show Content
  markedContent(fileName: string): string {
    let content = this.fileContentMap[fileName] || '';
    return content;
  }

  filterLinesByOptions(lines: string[], options: string[]): string[] {
    return lines.filter((line) =>
      options.every(
        (option) => !new RegExp(`\\b.*${option}.*\\b`, 'gi').test(line)
      )
    );
  }

  submitDelete(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      const lines = this.fileContentMap[this.selectedFileName].split('\n');
      const filteredLines = this.filterLinesByOptions(
        lines,
        this.selectedDeleteOptions
      );
      this.fileContentMap[this.selectedFileName] = filteredLines.join('\n');
    }
  }

  // //Wlan-Button
  // deleteWlanLog(): void {
  //   if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Wlan && this.wlanLogVisible) {
  //     this.fileContentMap[this.selectedFileName] = this.filterService.applyFilters(
  //       this.fileContentMap[this.selectedFileName],
  //       this.wlanFilters
  //     );
  //     this.wlanLogVisible = false;
  //   }
  // }

  // onWlanCheckboxChange(): void {
  //   if (this.buttonStates.Wlan) {
  //     if (!this.wlanLogVisible) {
  //       this.showWlanLog();
  //     } else {
  //       this.deleteWlanLog();
  //     }
  //   }
  // }

  // private showWlanLog(): void {
  //   if (this.selectedFileName && this.originalFileContentMap[this.selectedFileName]) {
  //     this.fileContentMap[this.selectedFileName] = this.originalFileContentMap[this.selectedFileName];
  //     this.wlanLogVisible = true;
  //   }
  // }

  // // Bluetooth- Filter
  // deleteBluetoothLog(): void {
  //   if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Bluetooth) {
  //     this.fileContentMap[this.selectedFileName] = this.filterService.applyFilters(
  //       this.fileContentMap[this.selectedFileName],
  //       this.bluetoothFilters
  //     );
  //   }
  // }
  // onBluetoothCheckboxChange(): void {
  //   if (this.buttonStates.Bluetooth) {
  //     this.deleteBluetoothLog();
  //   }
  // }

  //  // Engine- Filter
  //  deleteEngineLog(): void {
  //   if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Engine) {
  //     this.fileContentMap[this.selectedFileName] = this.filterService.applyFilters(
  //       this.fileContentMap[this.selectedFileName],
  //       this.engineFilters
  //     );
  //   }
  // }
  // onEngineCheckboxChange(): void {
  //   if (this.buttonStates.Engine) {
  //     this.deleteEngineLog();
  //   }
  // }

  // // delete Spam and unnecessary Content
  // deleteSpam(): void {
  //   if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Spam) {
  //     this.fileContentMap[this.selectedFileName] = this.filterService.applyFilters(
  //       this.fileContentMap[this.selectedFileName],
  //       this.spamFilters
  //     );
  //   }
  // }
  // onSpamCheckboxChange(): void {
  //   if (this.buttonStates.Spam) {
  //     this.deleteSpam();
  //   }
  // }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['buttonStates'] && !changes['buttonStates'].firstChange) {
  //     this.deleteWlanLog();
  //   }
  // }

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
