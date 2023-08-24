import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { DataService } from '../data.service';

const SPOTIFY_CLIENT_ID = 'f59c11422eac41e19ba6959a296bca8d';

export interface ISpotifyCodeVerifier {
  codeVerifier: string;
  state: string;
}

export function isSpotifyCodeVerifier(value: SpotifyTokens): value is ISpotifyCodeVerifier {
  if (value)
    if (Object.hasOwn(value, 'codeVerifier'))
      if (Object.hasOwn(value, 'state'))
        return true;
  return false;
}

export interface ISpotifyTokens {
  accessToken: string;
  refreshToken: string;
}

export function hasSpotifyTokens(value: SpotifyTokens): value is ISpotifyTokens {
  if (value)
    if (Object.hasOwn(value, 'accessToken'))
      if (Object.hasOwn(value, 'refreshToken'))
        return true;
  return false;
}

export type SpotifyTokens = ISpotifyCodeVerifier | ISpotifyTokens | null;

@Injectable({ providedIn: 'root' })
export class SpotifyAuthService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly data: DataService) {
    this.redirectUri = new URL('spotify', document.location.origin).toString();
  }
  private redirectUri: string;
  private generateRandomString(length: number) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
  private async generateCodeChallenge(codeVerifier: string) {
    function base64encode(value: ArrayBuffer) {
      return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(value))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const value = await this.document.defaultView!
      .crypto.subtle.digest('SHA-256', data);
    return base64encode(value);
  }
  async getAccessToken(redirect?: { code: string; state: string; }) {
    if (this.data.isOnline) {
      let valid = false;
      const tokens = this.data.spotifyTokens;
      const body = new URLSearchParams({ client_id: SPOTIFY_CLIENT_ID });
      if (redirect) {
        if (isSpotifyCodeVerifier(tokens)) {
          if (redirect.state === tokens.state) {
            body.set('grant_type', 'authorization_code');
            body.set('code', redirect.code);
            body.set('code_verifier', tokens.codeVerifier);
            body.set('redirect_uri', this.redirectUri);
            valid = true;
          }
        }
      }
      else {
        if (hasSpotifyTokens(tokens)) {
          body.set('grant_type', 'refresh_token');
          body.set('refresh_token', tokens.refreshToken);
          valid = true;
        }
        else await this.authorize();
      }
      if (valid) {
        const tokens = await this.getTokens(body);
        if (tokens) return tokens.accessToken;
      }
    }
    else this.router.navigate(['spotify/offline']);
    return null;
  }
  private async authorize() {
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);
    const state = this.generateRandomString(16);
    this.data.spotifyTokens = { codeVerifier, state };
    let args = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: 'user-read-private user-read-email streaming user-modify-playback-state',
      redirect_uri: this.redirectUri,
      state: this.data.spotifyTokens.state,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge
    });
    this.data.redirectPath = this.router.url;
    this.document.defaultView!
      .location.assign(`https://accounts.spotify.com/authorize?${args}`);
  }
  private async getTokens(body: URLSearchParams) {
    return await firstValueFrom(this.http.post<{
      access_token: string;
      refresh_token: string;
    }>('https://accounts.spotify.com/api/token',
      body, {
      observe: 'response',
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      })
    })).then(response => {
      if (response.ok && response.body) {
        this.data.spotifyTokens = {
          accessToken: response.body.access_token,
          refreshToken: response.body.refresh_token
        };
        this.data.spotifyHidden = false;
        return this.data.spotifyTokens;
      }
      else return null;
    });
  }
}
