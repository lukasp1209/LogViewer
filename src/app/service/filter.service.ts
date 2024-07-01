import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FilterService {

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


  removeCustomLines(customWord: string, selectedFileName: string, fileContentMap: { [fileName: string]: string }, hiddenLinesMap: { [fileName: string]: string[] }, dropdownList: any[], selectedItems: any[]): void {
    if (selectedFileName && fileContentMap[selectedFileName] && customWord) {
        const lines = fileContentMap[selectedFileName].split('\n');
        hiddenLinesMap[selectedFileName] = lines.filter((line) =>
          new RegExp(`\\b.*${customWord}.*\\b`, 'gi').test(line)
        );
        fileContentMap[selectedFileName] = lines
          .filter((line) => !new RegExp(`\\b.*${customWord}.*\\b`, 'gi').test(line))
          .join('\n');
          
        if (!dropdownList.some((item: any) => item.item_text === customWord)) {
          dropdownList.push({ item_id: dropdownList.length + 1, item_text: customWord });
          selectedItems.push({ item_id: dropdownList.length + 1, item_text: customWord });
        }
      }
    }

  restoreHiddenLines(
    customWord: string,
    selectedFileName: string,
    fileContentMap: { [key: string]: string },
    originalFileContentMap: { [key: string]: string },
    hiddenLinesMap: { [key: string]: string[] },
    dropdownList: any[],
    selectedItems: any[]
  ): void {
    if (selectedFileName && hiddenLinesMap[selectedFileName]) {
      const originalLines = originalFileContentMap[selectedFileName].split('\n');
      const hiddenLines = hiddenLinesMap[selectedFileName];
      const combinedLines = [...originalLines, ...hiddenLines].sort((a, b) => {
        return originalLines.indexOf(a) - originalLines.indexOf(b);
      });
      fileContentMap[selectedFileName] = combinedLines.join('\n');
      delete hiddenLinesMap[selectedFileName];

      // Remove the custom filter from the dropdown list
      dropdownList = dropdownList.filter((item: any) => item.item_text !== customWord);
      selectedItems = selectedItems.filter((item: any) => item.item_text !== customWord);
    }
  }
}
