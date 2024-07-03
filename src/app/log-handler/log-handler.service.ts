import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FilterService } from 'src/app//filter/filter.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LogHandlerService {
  selectedFileName: string;
  fileContentMap: { [key: string]: string };
  buttonStates = {
    LogLevel: false,
  };
  filterConfig: { [key: string]: any };

  constructor(private filterService: FilterService, private http: HttpClient) {
    this.selectedFileName = '';
    this.fileContentMap = {};
    this.filterConfig = {};

    this.loadFilterConfig().subscribe(config => {
      this.filterConfig = config;
    });
  }

  public loadFilterConfig(): Observable<{ [key: string]: any }> {
    return this.http.get<{ [key: string]: any }>('assets/filter-config.json');
  }
}
