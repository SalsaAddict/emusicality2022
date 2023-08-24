import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SpotifyAuthService } from './spotify-auth.service';
import { DataService } from '../data.service';

@Component({
  selector: 'app-spotify',
  template: ''
})
export class SpotifyComponent implements OnInit {
  constructor(
    private readonly router: Router,
    private readonly data: DataService,
    private readonly auth: SpotifyAuthService) {
  }
  async ngOnInit() {
    const search = new URLSearchParams(document.location.search);
    if (search.has('code')) {
      const redirect = {
        code: search.get('code') ?? '',
        state: search.get('state') ?? ''
      };
      const accessToken = await this.auth.getAccessToken(redirect);
      if (accessToken)
        this.router.navigate([this.data.redirectPath])
      else
        this.router.navigate(['home'])
    }
    else if (search.has('enabled')) {
      this.data.spotifyEnabled = search.get('enabled')?.toLowerCase().trim() !== 'false';
      this.router.navigate(['home']);
    }
    else this.router.navigate(['home']);
  }
}
