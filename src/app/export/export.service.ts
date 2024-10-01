import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  exportFile(contentElementId: string, fileName: string): void {
    const element = document.getElementById(contentElementId);

    if (!element) {
      console.error('Element not found');
      return;
    }

    const htmlContent = element.outerHTML;

    const blob = new Blob([htmlContent], { type: 'text/html' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.html`;

    link.click();

    URL.revokeObjectURL(link.href);
  }
}
