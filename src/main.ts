// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { routes } from './app/routes';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { licenseKey } from './devextreme-license';
import config from 'devextreme/core/config';

config({
  licenseKey,
});

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient()],
});
