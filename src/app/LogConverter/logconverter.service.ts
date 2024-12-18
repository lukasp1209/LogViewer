import { Injectable } from '@angular/core';

export interface Log {
  Datum: string;
  Uhrzeit: string;
  Loglevel: string;
  Quelle: string;
  Nachricht: string;
  Thema: string;
}

const logs: Log[] = [
  {
    Datum: '2024.12.24',
    Uhrzeit: '21:00:00',
    Loglevel: 'Fatal',
    Quelle: 'LogConfigurationService',
    Nachricht:
      'Log configuration has been applied. Current minimum log level is Information',
    Thema: 'wlan',
  },
  {
    Datum: '2024.11.20',
    Uhrzeit: '21:10:00',
    Loglevel: 'Fatal',
    Quelle: 'LogConfigurationService',
    Nachricht:
      'Log configuration has been applied. Current minimum log level is Information',
    Thema: 'wlan',
  },
  {
    Datum: '2020.07.24',
    Uhrzeit: '01:00:00',
    Loglevel: 'Info',
    Quelle: 'DatabaseManager',
    Nachricht:
      'Log configuration has been applied. Current minimum log level is Information',
    Thema: 'wlan',
  },
];

@Injectable({
  providedIn: 'root',
})
export class LogConverterService {
  getLogs(): Log[] {
    return logs;
  }

  parseLogs(content: string): Log[] {
    const logLines = content.split('\n');
    const formattedLogs: Log[] = logLines
      .map((line) => this.parseLogLine(line))
      .filter((log) => log !== null);
    return formattedLogs;
  }
  private parseLogLine(line: string): Log | null {
    const logPattern =
      /(?<Datum>\d{4}[-.]\d{2}[-.]\d{2})\s+(?<Uhrzeit>\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\s+\[(?<Loglevel>\w+)]\s+(?<Quelle>[^\s]+)\s+(?<Nachricht>.+)/;
    const match = line.match(logPattern);

    if (match && match.groups) {
      return {
        Datum: match.groups['Datum'].replace(/-/g, '.'),
        Uhrzeit: match.groups['Uhrzeit'],
        Loglevel: match.groups['Loglevel'],
        Quelle: match.groups['Quelle'],
        Nachricht: match.groups['Nachricht'],
        Thema: '',
      };
    }
    return null;
  }
}
