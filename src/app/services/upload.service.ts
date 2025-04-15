import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { Log, LogConverterService } from '../LogConverter/logconverter.service';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(private logConverter: LogConverterService) {}

  async processFiles(fileList: FileList): Promise<{
    txtFiles: File[];
    logs: Log[];
    fileLogsMap: { [key: string]: Log[] };
  }> {
    const zip = new JSZip();
    const txtFiles: File[] = [];
    const logs: Log[] = [];
    const fileLogsMap: { [key: string]: Log[] } = {};

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.name.endsWith('.zip')) {
        await this.processZipFile(file, zip, txtFiles, logs, fileLogsMap);
      } else if (file.name.endsWith('.txt')) {
        await this.processTxtFile(file, txtFiles, logs, fileLogsMap);
      }
    }

    return { txtFiles, logs, fileLogsMap };
  }

  private async processZipFile(
    file: File,
    zip: JSZip,
    txtFiles: File[],
    logs: Log[],
    fileLogsMap: { [key: string]: Log[] }
  ): Promise<void> {
    console.log('Processing ZIP file:', file.name);
    const zipData = await zip.loadAsync(file);
    const fileNames = Object.keys(zipData.files);

    const maxFiles = 100000000;
    let processedFiles = 0;

    for (const fileName of fileNames) {
      if (processedFiles >= maxFiles) {
        console.warn(
          `File limit reached: Only processing the first ${maxFiles} files.`
        );
        break;
      }

      console.log('Processing file inside ZIP:', fileName);

      if (fileName.endsWith('.txt')) {
        try {
          const text = await zipData.files[fileName].async('text');
          const extractedFile = new File([new Blob([text])], fileName);
          txtFiles.push(extractedFile);

          const parsedLogs = this.logConverter.parseLogs(text, fileName);
          logs.push(...parsedLogs);
          fileLogsMap[fileName] = parsedLogs;

          processedFiles++;
        } catch (error) {
          console.error(`Error processing file ${fileName}:`, error);
        }
      } else if (fileName.endsWith('.zip')) {
        console.warn('Nested ZIP files are not supported:', fileName);
      }
    }
  }
  private async processTxtFile(
    file: File,
    txtFiles: File[],
    logs: Log[],
    fileLogsMap: { [key: string]: Log[] }
  ): Promise<void> {
    const text = await this.readFileAsText(file);
    txtFiles.push(file);

    const parsedLogs = this.logConverter.parseLogs(text, file.name);
    logs.push(...parsedLogs);
    fileLogsMap[file.name] = parsedLogs;
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }
}
