import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { homeResolver } from "./home/home.resolver";
import { SongComponent } from "./song/song.component";
import { songResolver } from "./song/song.resolver";
import { SpotifyComponent } from "./spotify/spotify.component";
import { spotifyResolver } from "./spotify/spotify.resolver";

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent,
    resolve: {
      songs: homeResolver
    },
  },
  {
    path: "spotify",
    component: SpotifyComponent
  },
  {
    path: "songs/:songId",
    component: SongComponent,
    resolve: {
      song: songResolver,
      device: spotifyResolver
    },
  },
  { path: "**", redirectTo: "home" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
