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
    } else {
      console.warn(
        'Keine benutzerdefinierten Wörter eingegeben. Die Zeilen werden nicht entfernt.'
      );
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

  filterLogsByDateTime(
    selectedDateTime: Date | null,
    selectedFileName: string
  ): void {
    if (!selectedFileName || !selectedDateTime) {
      return;
    }

    const dateString = selectedDateTime.toISOString().split('T')[0];
    const timeString = selectedDateTime.toTimeString().split(' ')[0];
    const originalContent =
      this.fileDataService.originalFileContentMap[selectedFileName];

    if (!originalContent) {
      return;
    }

    const lines = originalContent.split('\n');

    this.fileDataService.hiddenLinesMap[selectedFileName] = lines.filter(
      (line) => !line.includes(dateString) || !line.includes(timeString)
    );

    this.fileDataService.fileContentMap[selectedFileName] = lines
      .filter((line) => line.includes(dateString) && line.includes(timeString))
      .join('\n');
  }
}
