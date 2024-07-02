import { Injectable, SimpleChanges } from '@angular/core';
import { FilterService } from 'src/app/service/filter.service';

@Injectable({
  providedIn: 'root',
})
export class LogHandlerService {
  selectedFileName: string;
  fileContentMap: { [key: string]: string };
  buttonStates = {
    Wlan: false,
    Bluetooth: false,
    Engine: false,
    LogLevel: false,
    Spam: false,
  };
  filterConfig: { [key: string]: any };
  wlanFilters: string[] = ['WlanManager', 'WlanStatus'];
  bluetoothFilters: string[] = ['bluetooth', 'Bluetooth'];
  engineFilters: string[] = ['Engine'];
  spamFilters: string[] = [
    'Database',
    'Achtung',
    'CheckError',
    'CheckErrorExist',
    'SCardEstablishContext',
    'NIDA ID in Finish Refresh',
    'FieldMapper.ReadXML',
    'GetStatusChange',
    'MessageStateMachine',
  ];

  constructor(private filterService: FilterService) {
    this.selectedFileName = '';
    this.fileContentMap = {};
    this.filterConfig = {
      Wlan: this.wlanFilters,
      Bluetooth: this.bluetoothFilters,
      Engine: this.engineFilters,
      Spam: this.spamFilters,
    };
  }

  // deleteLog(filterType: keyof typeof this.buttonStates): void {
  //   if (
  //     this.selectedFileName &&
  //     this.fileContentMap[this.selectedFileName] &&
  //     this.buttonStates[filterType]
  //   ) {
  //     this.fileContentMap[this.selectedFileName] =
  //       this.filterService.applyFilters(
  //         this.fileContentMap[this.selectedFileName],
  //         this.filterConfig[filterType]
  //       );
  //   }
  // }

  // onCheckboxChange(filterType: keyof typeof this.buttonStates): void {
  //   if (this.buttonStates[filterType]) {
  //     this.deleteLog(filterType);
  //   }
  // }
}
