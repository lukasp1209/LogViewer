import { Injectable } from '@angular/core';
import { UploadService } from './upload.service';
import { Log } from './logconverter.service';

@Injectable({
  providedIn: 'root',
})
export class DragAndDropService {
  constructor(private uploadService: UploadService) {}

  async handleDrop(
    event: DragEvent,
    onSuccess: (result: {
      txtFiles: File[];
      logs: Log[];
      fileLogsMap: { [key: string]: Log[] };
    }) => void,
    onError: (error: any) => void
  ): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files.length) {
      const fileList = event.dataTransfer.files;

      try {
        const result = await this.uploadService.processFiles(fileList);
        onSuccess(result);
      } catch (error) {
        onError(error);
      }
    }
  }
}
