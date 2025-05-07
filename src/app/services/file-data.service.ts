import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDataService {
  fileContentMap: Record<string, string> = {};
  originalFileContentMap: Record<string, string> = {};
  hiddenLinesMap: Record<string, string[]> = {};
  dropdownList: string[] = [];
  selectedItems: string[] = [];

  markDropdownList: string[] = [];
  markSelectedItems: string[] = [];
  selectedTopics: string[] = [];
}
