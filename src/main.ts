import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { HttpStatusCode, HttpErrorResponse } from '@angular/common/http';

if (environment.production) {
  enableProdMode();
}

export function error(message: string, status: HttpStatusCode) {
  return new HttpErrorResponse({ status, error: { message } });
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
