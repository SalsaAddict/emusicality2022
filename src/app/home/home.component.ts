import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ISong, ISongs } from "src/schema/schema";
import { DataService } from "../data.service";
import { SpotifyService } from "../spotify/spotify.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"]
})
export class HomeComponent {
  constructor(
    route: ActivatedRoute,
    public readonly data: DataService,
    public readonly spotify: SpotifyService) {
    this.ask = data.count % 5 === 0;
    this.songs = route.snapshot.data["songs"];
  }
  public ask: boolean;
  public donate() {
    this.ask = false;
    window.open("https://paypal.me/salsaaddict/5");
  }
  public songUrl(songId: string) {
    return `/songs/${songId}`;
  }
  public songImg(songId: string) {
    return `/assets/songs/${songId}/cover.jpg`;
  }
  public songAlt(song: ISong) {
    return `${song.title} by ${song.artist}`;
  }
  public songNew(song: ISong) {
    let dte = new Date();
    dte.setDate(dte.getDate() - 7);
    return new Date(song.dateAdded) >= dte;
  }
  public readonly songs: ISongs;
  hide(song: ISong): boolean {
    return this.data.spotifyHidden && (song.spotify ?? false);
  }
}
