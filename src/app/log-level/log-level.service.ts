import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LogLevelService {
  constructor() {}

  markLogLevel(fileContent: string): string {
    const logLevelRegex = /\[(Info|Warn|Error|Fatal)\]/g;

    return fileContent.replace(logLevelRegex, (match) => {
      let backgroundColorClass = '';

      switch (match.toLowerCase()) {
        case '[info]':
          backgroundColorClass = 'bg-info';
          break;
        case '[warn]':
        case '[error]':
          backgroundColorClass = 'bg-warning';
          break;
        case '[fatal]':
          backgroundColorClass = 'bg-danger';
          break;
        default:
          backgroundColorClass = 'bg-info';
          break;
      }

      return `<span class="${backgroundColorClass}">${match}</span>`;
    });
  }

  undoMarkLogLevel(fileContent: string): string {
    const logLevelRegex =
      /<span class="(bg-info|bg-warning|bg-error|bg-danger)">(.*?)<\/span>/gi;

    return fileContent.replace(
      logLevelRegex,
      (match, backgroundColorClass, content) => content
    );
  }
}
