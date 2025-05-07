import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  showInfo(message: string): void {
    alert(`INFO: ${message}`);
  }

  showWarning(message: string): void {
    alert(`WARNING: ${message}`);
  }

  showError(message: string): void {
    alert(`ERROR: ${message}`);
  }
}
