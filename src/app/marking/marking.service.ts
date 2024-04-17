import { LogHandlerService } from "src/app/log-handler/log-handler.service";

export class MarkingService {
  constructor(private logHandlerService: LogHandlerService) {}

  markContent(selectedFileName: string, fileContentMap: {[key: string]: string}, regex: RegExp, enable: boolean): void {
    if (!selectedFileName || !fileContentMap[selectedFileName]) {
      return;
    }

    if (enable) {
      fileContentMap[selectedFileName] = fileContentMap[selectedFileName].replace(regex, (match) => `<mark>${match}</mark>`);
    } else {
      this.removeMark(selectedFileName, fileContentMap);
    }
  }

  removeMark(selectedFileName: string, fileContentMap: {[key: string]: string}): void {
    if (selectedFileName && fileContentMap[selectedFileName]) {
      fileContentMap[selectedFileName] = fileContentMap[selectedFileName].replace(/<mark>(.*?)<\/mark>/gi, (match, content) => content);
    }
  }
}
