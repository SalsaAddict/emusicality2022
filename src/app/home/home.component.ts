import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ISongs } from "src/schema/schema";
import { GlobalService } from "../global.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent {
  constructor(route: ActivatedRoute, public readonly global: GlobalService) {
    this.ask = global.count % 10 === 0 && !global.never;
    this.songs = route.snapshot.data["songs"];
  }
  public ask: boolean;
  public donate() {
    this.ask = false;
    window.open("https://paypal.me/salsaaddict/5");
  }
  public never() {
    this.global.never = true;
    this.ask = false;
  }
  public songUrl(songId: string) {
    return `/songs/${songId}`;
  }
  public songImg(songId: string) {
    return `/assets/songs/${songId}/cover.jpg`;
  }
  public readonly songs: ISongs;
}
