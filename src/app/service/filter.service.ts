import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  constructor(private fileDataService: FileDataService) {}

  applyFilters(content: string, filters: string[]): string {
    const lines = content.split('\n');

    const processedLines = lines.map(line => {
      const isAlreadyHidden = line.startsWith('<!-- hidden -->');
      const shouldHide = filters.some(filter =>
        new RegExp(`\\b.*${filter}.*\\b`, 'gi').test(line.replace('<!-- hidden -->', ''))
      );

      if (shouldHide && !isAlreadyHidden) {
        return `<!-- hidden -->${line}`;
      } else if (!shouldHide && isAlreadyHidden) {
        return line.replace('<!-- hidden -->', '');
      } else {
        return line;
      }
    });

    return processedLines.join('\n');
  }

  removeLines(customWords: string[], selectedFileName: string): void {
    if (selectedFileName && this.fileDataService.fileContentMap[selectedFileName] && customWords && customWords.length > 0) {
      const lines = this.fileDataService.fileContentMap[selectedFileName].split('\n');
      
      this.fileDataService.hiddenLinesMap[selectedFileName] = lines.filter((line) =>
        customWords.some(word => new RegExp(`\\b.*${word}.*\\b`, 'gi').test(line))
      );

      this.fileDataService.fileContentMap[selectedFileName] = lines
        .filter((line) => !customWords.some(word => new RegExp(`\\b.*${word}.*\\b`, 'gi').test(line)))
        .join('\n');
      
      customWords.forEach(word => {
        if (!this.fileDataService.dropdownList.some((item: any) => item.item_text === word)) {
          const newItem = { item_id: this.fileDataService.dropdownList.length + 1, item_text: word };
          this.fileDataService.dropdownList.push(newItem);
          this.fileDataService.selectedItems.push(newItem);
        }
      });
    }
  }
  

  restoreHiddenLines(customWord: string[], selectedFileName: string): void {
    if (selectedFileName && this.fileDataService.hiddenLinesMap[selectedFileName]) {
      const originalLines = this.fileDataService.originalFileContentMap[selectedFileName].split('\n');
      const hiddenLines = this.fileDataService.hiddenLinesMap[selectedFileName];
      const combinedLines = [...originalLines, ...hiddenLines].sort((a, b) => {
        return originalLines.indexOf(a) - originalLines.indexOf(b);
      });
      this.fileDataService.fileContentMap[selectedFileName] = combinedLines.join('\n');
      delete this.fileDataService.hiddenLinesMap[selectedFileName];

      this.fileDataService.selectedItems = this.fileDataService.selectedItems.filter((item: any) => item.item_text !== customWord);
    }
  }
}
