import { Injectable } from '@angular/core';

export interface Log {
  Datum: string;
  Uhrzeit: string;
  Loglevel: string;
  Nachricht: string;
  Thema: string;
}

const logs: Log[] = [];

@Injectable({
  providedIn: 'root',
})
export class LogConverterService {
  getLogs(): Log[] {
    return logs;
  }

  parseLogs(logContent: string): Log[] {
    const logLines = logContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '');

    const parsedLogs: Log[] = [];
    const logRegex =
      /(\d{4}[-.]\d{2}[-.]\d{2}|\d{2}[-.]\d{2}[-.]\d{4})[ \t]+(\d{2}:\d{2}:\d{2})\s+(\[?(Info|Warn|Error|Fatal)]?)?\s*(.+)?/;

    logLines.forEach((line) => {
      const match = logRegex.exec(line);

      if (match) {
        const [_, date, time, logLevel = '', source = '', message = ''] = match;
        parsedLogs.push({
          Datum: this.formatDate(date),
          Uhrzeit: time,
          Loglevel: logLevel.replace(/[\[\]]/g, '') || '',
          Nachricht: message.trim(),
          Thema: source || '',
        });
      }
    });

    return parsedLogs;
  }

  formatDate(date: string): string {
    if (date.includes('-')) {
      return date.replace(/-/g, '.');
    }
    const parts = date.split('.');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
}
