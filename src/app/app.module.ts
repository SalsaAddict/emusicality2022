import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { SongComponent } from "./song/song.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { NgbCollapseModule, NgbDropdownModule } from "@ng-bootstrap/ng-bootstrap";
import { AnimateIfDirective } from "./animate-if.directive";
import { HomeComponent } from "./home/home.component";
import { SpotifyComponent } from './spotify/spotify.component';

@NgModule({
  declarations: [
    AppComponent,
    SongComponent,
    AnimateIfDirective,
    HomeComponent,
    SpotifyComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the app is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
    NgbDropdownModule,
    NgbCollapseModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
