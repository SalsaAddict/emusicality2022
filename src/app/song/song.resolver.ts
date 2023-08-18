import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { RouterStateSnapshot, ActivatedRouteSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { ISongs, IBreakdown } from "src/schema/schema";
import { Song } from "./song";
import { GlobalService } from "../global.service";

@Injectable({ providedIn: "root" })
export class SongResolver {
  constructor(
    private readonly http: HttpClient,
    private readonly global: GlobalService) { }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return new Promise<Song>((resolve, reject) => {
      let path = "/assets/songs/", songId: string = route.params["songId"];
      this.global.songId = songId;
      this.http.get<ISongs>(`${path}songs.json`)
        .subscribe(iSongs => {
          path += `${songId}/`;
          this.http.get<IBreakdown>(`${path}breakdown.json`)
            .subscribe(iBreakdown => {
              resolve(new Song(songId, iSongs[songId], iBreakdown));
            });
        });
    });
  }
}
