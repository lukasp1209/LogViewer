import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';
import { SearchService } from '../search/search.service';

@Injectable({
  providedIn: 'root'
})
export class HighlightingService {
  SearchService: any;

  constructor(private fileDataService: FileDataService) {}

  highlightLogs(terms: string[], fileName: string): void {
    if (!fileName || !terms.length) return;
  
    let content = this.fileDataService.originalFileContentMap[fileName];
    if (!content) return;
  
    terms.forEach(term => {
      content = this.SearchService.highlightTerm(content, term);
    });
  
    this.fileDataService.fileContentMap[fileName] = content;
  }
  
}
