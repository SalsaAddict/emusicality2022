import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalService, ISpotifyAuthCode, isSpotifyAuthCode, isSpotifyToken } from './global.service';
import { error } from 'src/main';

const SPOTIFY_CLIENT_ID = 'f59c11422eac41e19ba6959a296bca8d';
const REDIRECT_URI = 'https://localhost:4200/spotify';

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly global: GlobalService,
    private readonly http: HttpClient) { }
  get loggedIn() {
    return isSpotifyToken(this.global.spotify);
  }
  private generateRandomString(length: number) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  private async generateCodeChallenge(codeVerifier: string) {
    function base64encode(string: ArrayBuffer) {
      return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(string))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64encode(digest);
  }
  authorize = () => {
    const data: ISpotifyAuthCode = {
      codeVerifier: this.generateRandomString(128),
      state: this.generateRandomString(16)
    };
    this.global.spotify = data;
    this.generateCodeChallenge(data.codeVerifier)
      .then(codeChallenge => {
        const scope = 'user-read-private user-read-email streaming user-modify-playback-state';
        const args = new URLSearchParams({
          response_type: 'code',
          client_id: SPOTIFY_CLIENT_ID,
          scope: scope,
          redirect_uri: REDIRECT_URI,
          state: data.state!,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge
        });
        this.document.defaultView?.location
          .assign(`https://accounts.spotify.com/authorize?${args}`);
      });
  }
  getAccessToken = (redirect?: { code: string; state: string; }) => {
    return new Promise<string>((resolve, reject) => {
      let body = new URLSearchParams();
      body.set('client_id', SPOTIFY_CLIENT_ID);
      if (redirect) {
        if (isSpotifyAuthCode(this.global.spotify)) {
          if (redirect.state === this.global.spotify.state) {
            body.set('grant_type', 'authorization_code');
            body.set('code', redirect.code);
            body.set('code_verifier', this.global.spotify.codeVerifier ?? '');
            body.set('redirect_uri', REDIRECT_URI);
          }
          reject(error('Incorrect state.', HttpStatusCode.BadRequest));
        }
        else {
          reject(error('Unexpected redirect.', HttpStatusCode.BadRequest));
          return;
        }
      }
      else {
        if (isSpotifyToken(this.global.spotify)) {
          body.set('grant_type', 'refresh_token');
          body.set('refresh_token', this.global.spotify.refreshToken);
        }
        else {
          this.authorize();
          reject(error('Refresh token required.', HttpStatusCode.BadRequest));
          return;
        }
      }
      firstValueFrom(this.http.post<{
        access_token: string;
        refresh_token: string;
      }>('https://accounts.spotify.com/api/token',
        body, {
        observe: 'response',
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded'
        })
      })).then(
        response => {
          if (response.ok && response.body) {
            this.global.spotify = {
              accessToken: response.body.access_token,
              refreshToken: response.body.refresh_token,
            };
            this.global.hideSpotify = false;
            resolve(response.body.access_token);
          }
          else reject(response);
        }, reject
      );
    });
  }
}
