import {
  Component,
  EventEmitter,
  Output,
  ElementRef,
  ViewChild,
  OnInit,
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
  router: any;
  columns: any;

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
  fileLogsMap: { [key: string]: Log[] } = {};

  loadFiles(event: any): void {
    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.fileUploaded = false;
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
            .catch((error) => {
              console.error('Fehler beim Laden der ZIP-Datei:', error);
              this.fileUploaded = false;
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
          };
          reader.readAsText(file);
        }
      }

      this.txtFilesLoaded.emit(txtFiles);
      this.zipContents = txtFiles;
      if (this.zipContents.length > 0) {
        this.selectedFileName = this.zipContents[0].name;
      }
      this.showUploadForm = false;
      this.fileUploaded = true;
    }
  }

  updateGridData(logs: Log[]): void {
    this.logsDataSource = [...logs.slice(0, 10000)];
    this.resetGrid(this.logGrid);
  }

  onFileSelectionChange(selectedFile: string): void {
    if (selectedFile && this.fileLogsMap[selectedFile]) {
      this.logsDataSource = this.fileLogsMap[selectedFile];
    } else {
      this.logsDataSource = [];
    }
    this.resetGrid(this.logGrid);
  }

  resetGrid(logGrid: DxDataGridComponent): void {
    logGrid.instance.clearSelection();
    logGrid.instance.clearFilter();
  }
}
