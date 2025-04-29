import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  showInfo(message: string): void {
    console.info(`INFO: ${message}`);
    alert(`INFO: ${message}`);
  }

  showWarning(message: string): void {
    console.warn(`WARNING: ${message}`);
    alert(`WARNING: ${message}`);
  }

  showError(message: string): void {
    console.error(`ERROR: ${message}`);
    alert(`ERROR: ${message}`);
  }
}
