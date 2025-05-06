import { Injectable } from '@angular/core';
import { unzipSync, strFromU8, Unzipped } from 'fflate';
import { Log, LogConverterService } from './logconverter.service';
import { NotificationService } from './notification.service';
import * as iconv from 'iconv-lite';
import { Buffer } from 'buffer';

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
        await this.processZipFile(file, txtFiles, logs, fileLogsMap);
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
    txtFiles: File[],
    logs: Log[],
    fileLogsMap: { [key: string]: Log[] }
  ): Promise<void> {
    try {
      console.log('ZIP-Datei wird verarbeitet:', file.name);

      const arrayBuffer = await file.arrayBuffer();

      const unzipped: Unzipped = unzipSync(new Uint8Array(arrayBuffer));

      let processedFiles = 0;

      for (const rawFileName in unzipped) {
        const fileName = this.decodeFileName(rawFileName);
        console.log('Dekodierter Dateiname aus ZIP:', fileName);

        if (fileName.endsWith('.txt')) {
          if (processedFiles >= this.maxFilesInZip) {
            this.notificationService.showWarning(
              `Dateilimit erreicht: Es werden nur die ersten ${this.maxFilesInZip} Dateien in "${file.name}" verarbeitet.`
            );
            break;
          }
          const fileContent = strFromU8(unzipped[rawFileName]);
          const parsedLogs = this.parseLogsFromText(fileContent, fileName);
          const extractedFile = new File([new Blob([fileContent])], fileName);

          txtFiles.push(extractedFile);
          logs.push(...parsedLogs);
          fileLogsMap[fileName] = parsedLogs;

          processedFiles++;
        } else {
          console.warn(`Nicht unterstützte Datei im ZIP-Archiv: "${fileName}"`);
        }
      }
    } catch (error) {
      this.handleError(
        `Fehler beim Verarbeiten der ZIP-Datei "${file.name}"`,
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

  private decodeFileName(rawFileName: string): string {
    const bytes = new Uint8Array(
      rawFileName.split('').map((char) => char.charCodeAt(0))
    );

    return iconv.decode(Buffer.from(bytes), 'cp437');
  }
}
