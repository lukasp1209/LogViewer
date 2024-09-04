import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileDataService {
  fileContentMap: { [fileName: string]: string } = {};
  originalFileContentMap: { [fileName: string]: string } = {};
  hiddenLinesMap: { [fileName: string]: string[] } = {};
  dropdownList: any[] = [];
  selectedItems: any[] = [];

  markDropdownList: any[] = [];
  markSelectedItems: any[] = [];
}


