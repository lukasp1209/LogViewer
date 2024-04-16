import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FilterService {

  applyFilters(content: string, filters: string[]): string {
    return content
      .split('\n')
      .filter(line => !filters.some(filter => new RegExp(`\\b.*${filter}.*\\b`, 'gi').test(line)))
      .join('\n');
  }
}
