import { Injectable } from '@angular/core';

export interface Log {
  Datum: string;
  Uhrzeit: string;
  Loglevel: string;
  Nachricht: string;
  Thema: string;
}

const logs: Log[] = [];

const THEMA_MAPPING: { [key: string]: string[] } = {
  Wlan: ['WlanManager', 'WlanStatus'],
  Bluetooth: ['Bluetooth'],
  Engine: ['Engine'],
  Drucken: ['print', 'Printer'],
  Einsatzerstellung: ['Generating'],
  Einsatzabschluss: ['removing silent record!'],
  Nida_Start: ['NIDA started'],
  Benutzer_Reset: ['Neustart durch den Benutzer'],
  Manuell_gelöscht: ['Engine.record_do_action: removing record!'],
};

@Injectable({
  providedIn: 'root',
})
export class LogConverterService {
  getLogs(): Log[] {
    return logs;
  }

  parseLogs(logContent: string, fileName: string): Log[] {
    const logLines = logContent.split('\n').map((line) => line.trim());
    const parsedLogs: Log[] = [];

    const logRegex =
      /(\d{4}[-.]\d{2}[-.]\d{2}|\d{2}[-.]\d{2}[-.]\d{4})[ \t]+(\d{2}:\d{2}:\d{2})(?:\.\d{1,4})?[ \t]*(\[?(Info|Warn|Error|Fatal|INF|WRN|ERR|FTL)?\]?)?:?[ \t]*(.*)/;

    const serilogRegex =
      /^\[(\d{4}\.\d{2}\.\d{2}) (\d{2}:\d{2}:\d{2}\.\d{3}) ([A-Z]+)\s+([\w\d\.]+)\s*\]? (.*)$/;

    let currentLog: Log | null = null;

    logLines.forEach((line) => {
      if (fileName === 'preferences.txt') {
        line = line.replace(/ /g, '\n');
      }

      let match = serilogRegex.exec(line);
      let isSerilog = !!match;

      if (!isSerilog) {
        match = logRegex.exec(line);
      }

      if (match) {
        if (currentLog) {
          parsedLogs.push(currentLog);
        }

        const [_, date, time, logLevel, rawThema, message] = match;
        const cleanedMessage = message?.trim() || '';
        const cleanedLogLevel = logLevel?.replace(/[\[\]]/g, '') || '';
        const thema = isSerilog
          ? rawThema
          : this.determineThema(cleanedLogLevel, cleanedMessage);

        currentLog = {
          Datum: this.formatDate(date),
          Uhrzeit: time,
          Loglevel: cleanedLogLevel,
          Nachricht: cleanedMessage,
          Thema: thema,
        };
      } else if (currentLog) {
        currentLog.Nachricht += ' ' + line;
      } else {
        const cleanedMessage = line.trim();
        const log: Log = {
          Datum: '',
          Uhrzeit: '',
          Loglevel: '',
          Nachricht: cleanedMessage,
          Thema: '',
        };
        parsedLogs.push(log);
      }
    });

    if (currentLog) {
      parsedLogs.push(currentLog);
    }

    return parsedLogs;
  }

  formatDate(date: string): string {
    if (date.includes('-')) {
      return date.replace(/-/g, '.');
    }
    const parts = date.split('.');
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  determineThema(source: string, message: string): string {
    for (const [thema, keywords] of Object.entries(THEMA_MAPPING)) {
      if (
        keywords.some(
          (keyword) => source.includes(keyword) || message.includes(keyword)
        )
      ) {
        return thema;
      }
    }
    return '';
  }
}
