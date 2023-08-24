import { inject } from "@angular/core";
import { ResolveFn } from "@angular/router";
import { Song } from "./song";
import { DataService } from "../data.service";

export const songResolver: ResolveFn<Song>
  = async (route, _state, data = inject(DataService)) => {
    const songId = route.params['songId'];
    const iSong = await data.iSong(songId);
    const iBreakdown = await data.iBreakdown(songId);
    return new Song(songId, iSong, iBreakdown);
  }