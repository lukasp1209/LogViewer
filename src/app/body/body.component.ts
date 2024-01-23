// body.component.ts
import { Component, EventEmitter, Output, ElementRef, ViewChild } from '@angular/core';
import * as JSZip from 'jszip';


@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']

})
export class BodyComponent {
  @Output() txtFilesLoaded = new EventEmitter<File[]>();
  @ViewChild('markedContentElement') markedContentElement: ElementRef | undefined;
  @Output() searchEvent = new EventEmitter<string>();

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
  
  // deleteOptions: { label: string; value: string }[] = [
  //   { label: '"items"', value: 'items' },
  //   { label: '"Database"', value: 'Database' },
  //   { label: '"CheckError"', value: 'CheckError' },
  //   { label: '"CheckErrorExist"', value: 'CheckErrorExist' },
  //   { label: '"SCardEstablishContext"', value: 'SCardEstablishContext' },
  //   { label: '"NIDA ID in Finish Refresh"', value: 'NIDA ID in Finish Refresh' },
  //   { label: '"FieldMapper.ReadXML"', value: 'FieldMapper.ReadXML' },
  // ]; 
  logs: any;

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.zipFile = fileList[0];
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

  onSearch() {
    this.searchEvent.emit(this.searchQuery);
  }

  selectFile(file: File): void {
    this.selectedFileName = file.name;
  }

  markedContent(fileName: string): string {
    let content = this.fileContentMap[fileName] || '';

    if (this.hiddenLines) {
      content = content.split('\n').map(line => line.includes('WlanManager') ? '' : line).join('\n');
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
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName].replace(
        /\b(cmd=remove)\b/gi,
        (match) => `<mark>${match}</mark>`
      );
    }
  }

  //Wlan-Button
  deleteWlanLog(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      if (!this.originalFileContentMap[this.selectedFileName]) {
        this.originalFileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName];
      }
  
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName]
        .split('\n')
        .filter(line => !/\b.*WlanManager.*\b/gi.test(line))
        .filter(line => !/\b.*WlanStatus.*\b/gi.test(line))
        .join('\n');
    }
  }

  // Reset Original Content
  showOriginalContent(): void {
    if (this.selectedFileName && this.originalFileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.originalFileContentMap[this.selectedFileName];
    }
  }
  // delete Spam and unnecessary Content
  deleteSpam(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName]
      
        .split('\n')
        .filter(line => !/\b.*Database.*\b/gi.test(line))
        .filter(line => !/\b.*Achtung.*\b/gi.test(line))
        .filter(line => !/\b.*CheckError.*\b/gi.test(line))
        .filter(line => !/\b.*CheckErrorExist.*\b/gi.test(line))
        .filter(line => !/\b.*SCardEstablishContext.*\b/gi.test(line))
        .filter(line => !/\b.*NIDA ID in Finish Refresh.*\b/gi.test(line))
        .filter(line => !/\b.*FieldMapper.ReadXML.*\b/gi.test(line))
        .filter(line => !/\b.*GetStatusChange.*\b/gi.test(line))
        .filter(line => !/\b.*MessageStateMachine.*\b/gi.test(line))
        .join('\n');
    }
  }

  // create Mission
  createMission(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName].replace(
        /\b(Generating NIDA ID)\b/gi,
        (match) => `<mark>${match}</mark>`
      );
    }
  }

  removeCustomLines(): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName] && this.customWord) {
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName]
        .split('\n')
        .filter(line => !new RegExp(`\\b.*${this.customWord}.*\\b`, 'gi').test(line))
        .join('\n');
    }
  }

  applyFilterByOption(option: string): void {
    if (this.selectedFileName && this.fileContentMap[this.selectedFileName]) {
      const filterRegex = new RegExp(`\\b.*${option}.*\\b`, 'gi');
      this.fileContentMap[this.selectedFileName] = this.fileContentMap[this.selectedFileName]
        .split('\n')
        .filter(line => !filterRegex.test(line))
        .join('\n');
    }
  }
  
  applyFilters(): void {
    this.selectedDeleteOptions.forEach(option => {
      this.applyFilterByOption(option);
    });
  }
}


