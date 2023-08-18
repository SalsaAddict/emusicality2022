import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalService } from '../global.service';
import { SpotifyAuthService } from '../spotify-auth.service';
import { DOCUMENT } from '@angular/common';

@Component({ selector: 'app-spotify', template: '' })
export class SpotifyComponent {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    spotifyAuth: SpotifyAuthService,
    router: Router,
    global: GlobalService) {
    const params = new URLSearchParams(document.defaultView?.location.search);
    if (params.has('enabled')) {
      global.enableSpotify = params.get('enabled')?.toLocaleLowerCase() !== 'false';
      global.hideSpotify = false;
      router.navigate(['/home']);
    }
    else spotifyAuth.getAccessToken({
      code: params.get('code') ?? '',
      state: params.get('state') ?? ''
    }).then(_ => {
      if (global.songId)
        router.navigate([`/songs/${global.songId}`]);
      else
        router.navigate(['/home']);
    }, _ => {
      router.navigate(['/home']);
    });
  }
}
