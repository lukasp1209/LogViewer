import { Injectable } from '@angular/core';
import { FileDataService } from 'src/app/FileData/file-data.service';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  constructor(private fileDataService: FileDataService) {}

  removeLines(customWords: string[], selectedFileName: string): void {
    if (
      selectedFileName &&
      this.fileDataService.fileContentMap[selectedFileName] &&
      customWords &&
      customWords.length > 0
    ) {
      const lines =
        this.fileDataService.fileContentMap[selectedFileName].split('\n');

      this.fileDataService.hiddenLinesMap[selectedFileName] = lines.filter(
        (line) =>
          customWords.some((word) =>
            new RegExp(`\\b.*${word}.*\\b`, 'gi').test(line)
          )
      );

      this.fileDataService.fileContentMap[selectedFileName] = lines
        .filter(
          (line) =>
            !customWords.some((word) =>
              new RegExp(`\\b.*${word}.*\\b`, 'gi').test(line)
            )
        )
        .join('\n');

      customWords.forEach((word) => {
        if (
          !this.fileDataService.dropdownList.some(
            (item: any) => item.item_text === word
          )
        ) {
          const newItem = {
            item_id: this.fileDataService.dropdownList.length + 1,
            item_text: word,
          };
          this.fileDataService.selectedItems.push(newItem);
        }
      });
    }
  }

  restoreHiddenLines(customWord: string[], selectedFileName: string): void {
    if (
      selectedFileName &&
      this.fileDataService.hiddenLinesMap[selectedFileName]
    ) {
      const originalLines =
        this.fileDataService.originalFileContentMap[selectedFileName].split(
          '\n'
        );
      const hiddenLines = this.fileDataService.hiddenLinesMap[selectedFileName];
      const combinedLines = [...originalLines, ...hiddenLines].sort((a, b) => {
        return originalLines.indexOf(a) - originalLines.indexOf(b);
      });
      this.fileDataService.fileContentMap[selectedFileName] =
        combinedLines.join('\n');
      delete this.fileDataService.hiddenLinesMap[selectedFileName];

      this.fileDataService.selectedItems =
        this.fileDataService.selectedItems.filter(
          (item: any) => item.item_text !== customWord
        );
    }
  }
}
