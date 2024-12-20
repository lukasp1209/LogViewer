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
import { FileDataService } from 'src/app/FileData/file-data.service';
import { Log, LogConverterService } from '../LogConverter/logconverter.service';

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
    protected fileDataService: FileDataService,
    protected logConverter: LogConverterService
  ) {
    this.logsDataSource = logConverter.getLogs();
  }

  logsDataSource: Log[] = [];

  zipFile: File | null = null;
  zipContents: Array<File> = [];
  selectedFileName: string = '';
  showUploadForm: boolean = true;
  fileUploaded: boolean = false;
  logData: { date: string; time: string; logLevel: string; message: string }[] =
    [];

  onFileChange(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.fileUploaded = false;
      this.zipFile = fileList[0];
      this.zipContents = [];
      const zip = new JSZip();
      zip
        .loadAsync(this.zipFile)
        .then((zipData) => {
          const txtFiles: File[] = [];
          const logs: Log[] = [];

          Object.keys(zipData.files).forEach((fileName) => {
            if (fileName.endsWith('.txt')) {
              zipData.files[fileName].async('text').then((text) => {
                const file = new File([new Blob([text])], fileName);
                txtFiles.push(file);

                this.fileDataService.originalFileContentMap[fileName] = text;

                const parsedLogs = this.logConverter.parseLogs(text);
                logs.push(...parsedLogs);

                this.updateGridData(logs);
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
        .catch((error) => {
          console.error('Fehler beim Laden der ZIP-Datei:', error);
          this.fileUploaded = false;
        });
    }
  }

  updateGridData(logs: Log[]): void {
    this.logsDataSource = logs;
  }

  onDropdownChange(): void {
    const selectedItems = this.fileDataService.markSelectedItems;
    const fileName = this.selectedFileName;

    if (!fileName) {
      return;
    }

    this.fileDataService.fileContentMap[fileName] =
      this.fileDataService.originalFileContentMap[fileName];
  }
}
