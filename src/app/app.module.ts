import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { BodyComponent } from './body/body.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { HttpClientModule } from '@angular/common/http';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  DxDataGridModule,
  DxTemplateModule,
  DxButtonModule,
  DxTabPanelModule,
  DxTabsModule,
  DxTextBoxModule,
} from 'devextreme-angular';

@NgModule({
  declarations: [AppComponent, HeaderComponent, BodyComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    NgbModule,
    NgMultiSelectDropDownModule,
    NgxMatSelectSearchModule,
    MatSelectModule,
    HttpClientModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DxDataGridModule,
    DxTemplateModule,
    DxButtonModule,
    DxTabPanelModule,
    DxTabsModule,
    DxTextBoxModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
