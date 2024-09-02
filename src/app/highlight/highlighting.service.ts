import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';

@Injectable({
  providedIn: 'root'
})
export class HighlightingService {

  constructor(private fileDataService: FileDataService) {}

  highlightLogs(terms: string[], fileName: string): void {
    if (!fileName || !terms.length) return;

    let content = this.fileDataService.originalFileContentMap[fileName];
    if (!content) return;

    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      content = content.replace(regex, match => `<mark>${match}</mark>`);
    });

    this.fileDataService.fileContentMap[fileName] = content;
  }
}
