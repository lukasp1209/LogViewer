import { Component } from '@angular/core';


interface SearchResult {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  title = 'webViewer';
  searchResults: SearchResult[] = [
    { id: 1, name: 'Angular', description: 'A platform for building applications with TypeScript, HTML, and CSS.' },
    { id: 2, name: 'React', description: 'A JavaScript library for building user interfaces.' },
    { id: 3, name: 'Vue.js', description: 'A progressive JavaScript framework for building user interfaces.' },
  ];

  filteredResults: SearchResult[] = [];

  onSearch(query: string) {
    this.filteredResults = this.searchResults.filter(result =>
      result.name.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    );
  }
}
