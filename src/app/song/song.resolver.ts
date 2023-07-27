import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { RouterStateSnapshot, ActivatedRouteSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { ISongs, IBreakdown } from "src/schema/schema";
import { Song } from "./song";

@Injectable({ providedIn: "root" })
export class SongResolver  {
  constructor(private readonly http: HttpClient) {}
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return new Observable<Song>((observer) => {
      let path = "/assets/songs/",
        songId: string = route.params["songId"];
      this.http.get<ISongs>(`${path}songs.json`).subscribe((iSongs) => {
        path += `${songId}/`;
        this.http
          .get<IBreakdown>(`${path}breakdown.json`)
          .subscribe((iBreakdown) => {
            observer.next(new Song(songId, iSongs[songId], iBreakdown));
            observer.complete();
          });
      });
    });
  }
}
