import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { RouterStateSnapshot, ActivatedRouteSnapshot } from "@angular/router";
import { ISongs } from "src/schema/schema";
import { GlobalService } from "../global.service";

@Injectable({ providedIn: "root" })
export class HomeResolver {
  constructor(
    private readonly http: HttpClient,
    private readonly global: GlobalService) { }
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.global.songId = null;
    return this.http.get<ISongs>("/assets/songs/songs.json");
  }
}
