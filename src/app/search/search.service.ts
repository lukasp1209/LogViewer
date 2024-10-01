import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private fileDataService: FileDataService) {}

  search(searchQuery: string, selectedFileName: string): void {
    const searchTerm = searchQuery.toLowerCase().trim();

    if (!searchTerm) {
      this.fileDataService.fileContentMap[selectedFileName] = this.fileDataService.originalFileContentMap[selectedFileName] || '';
      return;
    }

    const lines = this.fileDataService.originalFileContentMap[selectedFileName]?.split('\n') || [];

    const filteredLines = lines.filter(line =>
      line.toLowerCase().includes(searchTerm)
    );

    const highlightedLines = filteredLines.map(line =>
      line.replace(new RegExp(`${searchTerm}`, 'gi'), match =>
        `<span class="bg-warning">${match}</span>`
      )
    );

    this.fileDataService.fileContentMap[selectedFileName] = highlightedLines.join('\n');
  }
}