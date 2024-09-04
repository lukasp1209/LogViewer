import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(private fileDataService: FileDataService) {}

  search(searchQuery: string, selectedFileName: string): void {
    const searchTerm = searchQuery.trim();
  
    if (!searchTerm) {
      this.fileDataService.fileContentMap[selectedFileName] = this.fileDataService.originalFileContentMap[selectedFileName] || '';
      return;
    }
  
    const lines = this.fileDataService.originalFileContentMap[selectedFileName]?.split('\n') || [];
  
    const filteredLines = lines.filter(line =>
      line.toLowerCase().includes(searchTerm.toLowerCase())
    );
  
    const highlightedLines = filteredLines.map(line =>
      this.highlightTerm(line, searchTerm)
    );
  
    this.fileDataService.fileContentMap[selectedFileName] = highlightedLines.join('\n');
  }
  
  highlightTerm(content: string, term: string): string {
    const escapedTerm = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    return content.replace(regex, `<span style="bg-success">$1</span>`);
  }
  

}
