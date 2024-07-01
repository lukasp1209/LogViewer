import { Injectable, SimpleChanges } from '@angular/core';
import { FilterService } from 'src/app/service/filter.service';

@Injectable({
  providedIn: 'root',
})
export class LogHandlerService {
  selectedFileName: string;
  fileContentMap: { [key: string]: string };
  buttonStates = {
    Finish: false,
    Wlan: false,
    Mission: false,
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

  deleteLog(filterType: keyof typeof this.buttonStates): void {
    if (
      this.selectedFileName &&
      this.fileContentMap[this.selectedFileName] &&
      this.buttonStates[filterType]
    ) {
      this.fileContentMap[this.selectedFileName] =
        this.filterService.applyFilters(
          this.fileContentMap[this.selectedFileName],
          this.filterConfig[filterType]
        );
    }
  }

  onCheckboxChange(filterType: keyof typeof this.buttonStates): void {
    if (this.buttonStates[filterType]) {
      this.deleteLog(filterType);
    }
  }
//   //Wlan-Button
//     deleteWlanLog(): void {
//       if (
//         this.selectedFileName &&
//         this.fileContentMap[this.selectedFileName] &&
//         this.buttonStates.Wlan
//       ) {
//         this.fileContentMap[this.selectedFileName] =
//           this.filterService.applyFilters(
//             this.fileContentMap[this.selectedFileName],
//             this.wlanFilters
//           );
//       }
//     }

//     onWlanCheckboxChange(): void {
//       if (this.buttonStates.Wlan) {
//         this.deleteWlanLog();
//       }
//     }

//     // Bluetooth- Filter
//     deleteBluetoothLog(): void {
//       if (
//         this.selectedFileName &&
//         this.fileContentMap[this.selectedFileName] &&
//         this.buttonStates.Bluetooth
//       ) {
//         this.fileContentMap[this.selectedFileName] =
//           this.filterService.applyFilters(
//             this.fileContentMap[this.selectedFileName],
//             this.bluetoothFilters
//           );
//       }
//     }
//     onBluetoothCheckboxChange(): void {
//       if (this.buttonStates.Bluetooth) {
//         this.deleteBluetoothLog();
//       }
//     }

//     // Engine- Filter
//     deleteEngineLog(): void {
//       if (
//         this.selectedFileName &&
//         this.fileContentMap[this.selectedFileName] &&
//         this.buttonStates.Engine
//       ) {
//         this.fileContentMap[this.selectedFileName] =
//           this.filterService.applyFilters(
//             this.fileContentMap[this.selectedFileName],
//             this.engineFilters
//           );
//       }
//     }
//     onEngineCheckboxChange(): void {
//       if (this.buttonStates.Engine) {
//         this.deleteEngineLog();
//       }
//     }

//     // delete Spam and unnecessary Content
//     deleteSpam(): void {
//       if (
//         this.selectedFileName &&
//         this.fileContentMap[this.selectedFileName] &&
//         this.buttonStates.Spam
//       ) {
//         this.fileContentMap[this.selectedFileName] =
//           this.filterService.applyFilters(
//             this.fileContentMap[this.selectedFileName], this.spamFilters
//           );
//       }
//     }
//     onSpamCheckboxChange(): void {
//       if (this.buttonStates.Spam) {
//         this.deleteSpam();
//       }
//     }

//     ngOnChanges(changes: SimpleChanges): void {
//       if (changes['buttonStates'] && !changes['buttonStates'].firstChange) {
//         this.deleteWlanLog();
//       }
//     }
}
