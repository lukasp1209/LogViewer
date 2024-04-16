import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { BodyComponent } from './body/body.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { 
	IgxButtonModule,
	IgxInputGroupModule,
	IgxIconModule,
	IgxRippleModule,
	IgxTextHighlightModule
 } from "igniteui-angular";


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    BodyComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    DragDropModule,
    IgxButtonModule,
	  IgxIconModule,
	  IgxInputGroupModule,
	  IgxRippleModule,
	  IgxTextHighlightModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
