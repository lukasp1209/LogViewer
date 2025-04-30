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
  maxFilesInZip = 1000;

  async processFiles(fileList: FileList): Promise<{
    txtFiles: File[];
    logs: Log[];
    fileLogsMap: { [key: string]: Log[] };
  }> {
    const zip = new JSZip();
    const txtFiles: File[] = [];
    const logs: Log[] = [];
    const fileLogsMap: { [key: string]: Log[] } = {};

    for (const file of Array.from(fileList)) {
      if (this.isFileTooLarge(file)) {
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

  private isFileTooLarge(file: File): boolean {
    return file.size > this.maxFileSize * 1024 * 1024;
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

      let processedFiles = 0;

      for (const fileName of fileNames) {
        const sanitizedFileName = this.sanitizeFileName(fileName);
        console.log('Bereinigter Dateiname:', sanitizedFileName);

        if (sanitizedFileName.endsWith('.txt')) {
          if (processedFiles >= this.maxFilesInZip) {
            this.notificationService.showWarning(
              `Dateilimit erreicht: Es werden nur die ersten ${this.maxFilesInZip} Dateien in "${file.name}" verarbeitet.`
            );
            break;
          }

          await this.processTxtFileInZip(
            zipData,
            sanitizedFileName,
            txtFiles,
            logs,
            fileLogsMap
          );
          processedFiles++;
        } else if (sanitizedFileName.endsWith('.zip')) {
          this.notificationService.showWarning(
            `Verschachtelte ZIP-Dateien werden nicht unterstützt: "${sanitizedFileName}" innerhalb von "${file.name}".`
          );
        }
      }
    } catch (error) {
      this.handleError(
        `Fehler beim Verarbeiten der ZIP-Datei "${file.name}"`,
        error
      );
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^\x20-\x7E]/g, '');
  }

  private async processTxtFileInZip(
    zipData: JSZip,
    fileName: string,
    txtFiles: File[],
    logs: Log[],
    fileLogsMap: { [key: string]: Log[] }
  ): Promise<void> {
    try {
      const text = await zipData.files[fileName].async('text');
      const utf8Text = this.decodeUtf8(text);
      console.log('Dekodierter Text:', utf8Text);

      const parsedLogs = this.parseLogsFromText(utf8Text, fileName);
      const extractedFile = new File([new Blob([utf8Text])], fileName);

      txtFiles.push(extractedFile);
      logs.push(...parsedLogs);
      fileLogsMap[fileName] = parsedLogs;
    } catch (error) {
      this.handleError(
        `Fehler beim Verarbeiten der Datei "${fileName}" innerhalb der ZIP`,
        error
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
      const parsedLogs = this.parseLogsFromText(text, file.name);

      txtFiles.push(file);
      logs.push(...parsedLogs);
      fileLogsMap[file.name] = parsedLogs;
    } catch (error) {
      this.handleError(
        `Fehler beim Verarbeiten der TXT-Datei "${file.name}"`,
        error
      );
    }
  }

  private parseLogsFromText(text: string, fileName: string): Log[] {
    const lines = text.split('\n');
    const chunkSize = 10000;
    const parsedLogs: Log[] = [];

    for (let i = 0; i < lines.length; i += chunkSize) {
      const chunk = lines.slice(i, i + chunkSize).join('\n');
      const chunkLogs = this.logConverter.parseLogs(chunk, fileName);
      parsedLogs.push(...chunkLogs);
    }

    return parsedLogs;
  }

  private decodeUtf8(text: string): string {
    try {
      return new TextDecoder('utf-8', { fatal: true }).decode(
        new TextEncoder().encode(text)
      );
    } catch (error) {
      throw new Error(`Fehler beim Dekodieren als UTF-8: ${error}`);
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

  private handleError(message: string, error: unknown): void {
    const errorMessage =
      error instanceof Error ? error.message : 'Unbekannter Fehler';
    this.notificationService.showError(`${message}: ${errorMessage}`);
  }
}
