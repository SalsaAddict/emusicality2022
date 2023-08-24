import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { ISpotifyDevice, SpotifyService } from './spotify.service';
import { DataService } from '../data.service';

export const spotifyResolver: ResolveFn<ISpotifyDevice | null>
  = async (route, _state, data = inject(DataService), spotify = inject(SpotifyService)) => {
    const songId = route.params['songId'];
    const iSong = await data.iSong(songId);
    return iSong.spotify ? await spotify.getDevice() : null;
  };
