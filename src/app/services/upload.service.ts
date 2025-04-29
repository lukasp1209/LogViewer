import { Injectable } from '@angular/core';
import * as JSZip from 'jszip';
import { Log, LogConverterService } from './logconverter.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  constructor(
    private logConverter: LogConverterService,
    private notificationService: NotificationService
  ) {}

  maxFileSize = 250;

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
      if (file.size > this.maxFileSize * 1024 * 1024) {
        this.notificationService.showWarning(
          `Die Datei "${file.name}" ist zu groß und wird nicht verarbeitet. Maximale Größe: ${this.maxFileSize} MB`
        );
        continue;
      }

      if (file.name.endsWith('.zip')) {
        await this.processZipFile(file, zip, txtFiles, logs, fileLogsMap);
      } else if (file.name.endsWith('.txt')) {
        await this.processTxtFile(file, txtFiles, logs, fileLogsMap);
      } else {
        this.notificationService.showWarning(
          `Nicht unterstützter Dateityp: "${file.name}".`
        );
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
    try {
      console.log('ZIP-Datei wird verarbeitet:', file.name);
      const zipData = await zip.loadAsync(file);
      const fileNames = Object.keys(zipData.files);

      const maxFiles = 1000;
      let processedFiles = 0;

      for (const fileName of fileNames) {
        if (processedFiles >= maxFiles) {
          this.notificationService.showWarning(
            `Dateilimit erreicht: Es werden nur die ersten ${maxFiles} Dateien in "${file.name}" verarbeitet.`
          );
          break;
        }

        console.log('Datei innerhalb der ZIP wird verarbeitet:', fileName);

        if (fileName.endsWith('.txt')) {
          try {
            const text = await zipData.files[fileName].async('text');
            const lines = text.split('\n');
            const chunkSize = 10000;
            const parsedLogs: Log[] = [];

            for (let i = 0; i < lines.length; i += chunkSize) {
              const chunk = lines.slice(i, i + chunkSize).join('\n');
              const chunkLogs = this.logConverter.parseLogs(chunk, fileName);
              parsedLogs.push(...chunkLogs);
            }

            const extractedFile = new File([new Blob([text])], fileName);
            txtFiles.push(extractedFile);

            logs.push(...parsedLogs);
            fileLogsMap[fileName] = parsedLogs;

            processedFiles++;
          } catch (error) {
            this.notificationService.showError(
              `Fehler beim Verarbeiten der Datei "${fileName}" innerhalb der ZIP "${
                file.name
              }": ${
                error instanceof Error ? error.message : 'Unbekannter Fehler'
              }`
            );
          }
        } else if (fileName.endsWith('.zip')) {
          this.notificationService.showWarning(
            `Verschachtelte ZIP-Dateien werden nicht unterstützt: "${fileName}" innerhalb von "${file.name}".`
          );
        }
      }
    } catch (error) {
      this.notificationService.showError(
        `Fehler beim Verarbeiten der ZIP-Datei "${file.name}": ${
          error instanceof Error ? error.message : 'Unbekannter Fehler'
        }`
      );
    }
  }

  private async processTxtFile(
    file: File,
    txtFiles: File[],
    logs: Log[],
    fileLogsMap: { [key: string]: Log[] }
  ): Promise<void> {
    try {
      const text = await this.readFileAsText(file);
      txtFiles.push(file);

      const lines = text.split('\n');
      const chunkSize = 10000;
      const parsedLogs: Log[] = [];

      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n');
        const chunkLogs = this.logConverter.parseLogs(chunk, file.name);
        parsedLogs.push(...chunkLogs);
      }

      logs.push(...parsedLogs);
      fileLogsMap[file.name] = parsedLogs;
    } catch (error) {
      this.notificationService.showError(
        `Fehler beim Verarbeiten der TXT-Datei "${file.name}": ${
          error instanceof Error ? error.message : 'Unbekannter Fehler'
        }`
      );
    }
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
