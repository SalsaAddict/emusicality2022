import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import unmuteAudio from "unmute-ios-audio";
import { SongComponent } from "./song/song.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AnimateIfDirective } from "./animate-if.directive";
import { HomeComponent } from "./home/home.component";

@NgModule({
  declarations: [
    AppComponent,
    SongComponent,
    AnimateIfDirective,
    HomeComponent,
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
    NgbModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor() {
    unmuteAudio();
  }
}
