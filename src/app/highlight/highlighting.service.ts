import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';
import { LogHandlerService } from '../log-handler/log-handler.service';

@Injectable({
  providedIn: 'root',
})
export class HighlightingService {
  constructor(
    private fileDataService: FileDataService,
    private logHandlerService: LogHandlerService
  ) {}

  highlightLogs(topics: string[], fileName: string): void {
    if (!fileName || !topics || topics.length === 0) return;

    const content = this.fileDataService.originalFileContentMap[fileName];

    if (!content) return;

    let updatedContent = content;

    topics.forEach((topic) => {
      const terms: string[] = this.logHandlerService.markConfig[topic];

      if (!terms) return;

      terms.forEach((term) => {
        const searchTerm = term.toLowerCase().trim();

        if (!searchTerm) return;

        updatedContent = updatedContent.replace(
          new RegExp(`(${searchTerm})`, 'gi'),
          (match) => `<span class="bg-success">${match}</span>`
        );
      });
    });

    this.fileDataService.fileContentMap[fileName] = updatedContent;
  }
}
