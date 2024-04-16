// body.component.ts
import { Component, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';
import * as JSZip from 'jszip';
import { IgxTextHighlightDirective } from 'igniteui-angular';


@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']

})
export class BodyComponent {
  @Output() txtFilesLoaded = new EventEmitter<File[]>();
  @ViewChild('markedContentElement') markedContentElement: ElementRef | undefined;
  @ViewChild(IgxTextHighlightDirective, { read: IgxTextHighlightDirective, static: true })
  @Output() searchEvent = new EventEmitter<string>();

  public highlight!: IgxTextHighlightDirective;

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
  //checkbox Filters
  selectedFilters: string[] = [];
  checkboxOptions: { label: string; value: string; checked: boolean }[] = [
    { label: 'Einsatzabschluss', value: 'Finish', checked: false },
    { label: 'Wlanmanager', value: 'Wlan', checked: false },
    { label: 'Einsatzerstellung', value: 'Mission', checked: false },
    { label: 'Spam', value: 'Spam', checked: false }
  ];

  buttonStates = {
    Finish: false,
    Wlan: false,
    Mission: false,
    Spam: false
  };

  //Spam Filters
  private spamFilters: string[] = [
    'Database',
    'Achtung',
    'CheckError',
    'CheckErrorExist',
    'SCardEstablishContext',
    'NIDA ID in Finish Refresh',
    'FieldMapper.ReadXML',
    'GetStatusChange',
    'MessageStateMachine'
  ];
  //Wlan Filters
  private wlanFilters: string[] = [
    'WlanManager',
    'WlanStatus'
  ];
  logs: any;
  html: any;
  
  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
       this.onFilterReset();
      this.zipFile = fileList[0];
      console.log('Voller Pfad: ', this.zipFile.webkitRelativePath);
      document.title = `${this.zipFile.name}`;
      this.zipContents = [];
      const zip = new JSZip();
      zip.loadAsync(this.zipFile).then((zipData) => {
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
      });
    }
  }

  selectFile(file: File): void {
    this.selectedFileName = file.name;
  }

  

  // show Content
  // app-body.component.ts

markedContent(fileName: string): string {
  let content = this.fileContentMap[fileName] || '';

  if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Mission) {
    this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName].replace(
      /\b([Info])\b/gi,
      (match) => `<mark>${match}</mark>`
    );
  }
  return content;
}

  filterLinesByOptions(lines: string[], options: string[]): string[] {
    return lines.filter(line => options.every(option => !new RegExp(`\\b.*${option}.*\\b`, 'gi').test(line)));
  }

  submitDelete(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      const lines = this.fileContentMap[this.selectedFileName].split('\n');
      const filteredLines = this.filterLinesByOptions(lines, this.selectedDeleteOptions);
      this.fileContentMap[this.selectedFileName] = filteredLines.join('\n');
    }
  }

  // Mission close
  markCmd(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Finish) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName].replace(
        /\b(cmd=remove)\b/gi,
        (match) => `<mark>${match}</mark>`
      );
    }
  }
  onFinishCheckboxChange(): void {
    if (this.buttonStates.Finish) {
      this.markCmd();
    }
  }

  //Wlan-Button
  deleteWlanLog(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Wlan) {
      this.fileContentMap[this.selectedFileName] = this.applyFilters(
        this.fileContentMap[this.selectedFileName],
        this.wlanFilters
      );
    }
  }
  onWlanCheckboxChange(): void {
    if (this.buttonStates.Wlan) {
      this.deleteWlanLog();
    }
  }

  // Reset Original Content
  onFilterReset(): void {
    this.showOriginalContent();
  }

  showOriginalContent(): void {
    if (this.selectedFileName && this.originalFileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.originalFileContentMap[this.selectedFileName];
    }
  }

  // delete Spam and unnecessary Content
  deleteSpam(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Spam) {
      this.fileContentMap[this.selectedFileName] = this.applyFilters(
        this.fileContentMap[this.selectedFileName],
        this.spamFilters
      );
    }
  }

  onSpamCheckboxChange(): void {
    if (this.buttonStates.Spam) {
      this.deleteSpam();
    }
  }

  private applyFilters(content: string, filters: string[]): string {
    return content
      .split('\n')
      .filter(line => filters.every(filter => !new RegExp(`\\b.*${filter}.*\\b`, 'gi').test(line)))
      .join('\n');
  }
  // create Mission
  createMission(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.buttonStates.Mission) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName].replace(
        /\b(Generating NIDA ID)\b/gi,
        (match) => `<mark>${match}</mark>`
      );
    }
  }
  onMissionCheckboxChange(): void {
    if (this.buttonStates.Mission) {
      this.createMission();
    }
  }

  // custom Filters
  removeCustomLines(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.customWord) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName]
        .split('\n')
        .filter(line => !new RegExp(`\\b.*${this.customWord}.*\\b`, 'gi').test(line))
        .join('\n');
    }
  }

  // mark Log-level

  // Filter
}
  
