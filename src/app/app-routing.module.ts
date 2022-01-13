import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { HomeResolver } from "./home/home.resolver";
import { SongComponent } from "./song/song.component";
import { SongResolver } from "./song/song.resolver";

const routes: Routes = [
  {
    path: "home",
    component: HomeComponent,
    resolve: { songs: HomeResolver },
  },
  {
    path: "songs/:songId",
    component: SongComponent,
    resolve: { song: SongResolver },
  },
  { path: "**", redirectTo: "home" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
