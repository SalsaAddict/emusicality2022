import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, NgZone, RendererFactory2 } from '@angular/core';
import { SpotifyAuthService } from './spotify-auth.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as Tone from 'tone';
import { DataService } from '../data.service';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export interface ISpotifyDevice {
  deviceId: string;
  player: Spotify.Player;
  accessToken: string;
}

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly rendererFactory: RendererFactory2,
    private readonly router: Router,
    private readonly zone: NgZone,
    private readonly http: HttpClient,
    private readonly data: DataService,
    private readonly auth: SpotifyAuthService) { }
  private isWebPlaybackSDKReady = false;
  private loadWebPlaybackSDK() {
    return new Promise((resolve, reject) => {
      if (this.data.isOnline) {
        if (this.isWebPlaybackSDKReady)
          resolve(true);
        else {
          this.document.defaultView!
            .onSpotifyWebPlaybackSDKReady = () => {
              this.isWebPlaybackSDKReady = true;
              resolve(true);
            };
          const renderer = this.rendererFactory.createRenderer(null, null);
          const script: HTMLScriptElement = renderer.createElement('script');
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          renderer.appendChild(this.document.body, script);
        }
      }
      else {
        this.router.navigate(['spotify/offline'])
      }
    });
  }
  private device?: ISpotifyDevice;
  getDevice() {
    return new Promise<ISpotifyDevice | null>(async (resolve, reject) => {
      if (this.device)
        resolve(this.device)
      else if (await this.loadWebPlaybackSDK()) {
        const accessToken = await this.auth.getAccessToken();
        if (accessToken) {
          const player = new Spotify.Player({
            name: 'emusicality',
            volume: 1.0,
            getOAuthToken: cb => cb(accessToken),
            enableMediaSession: true
          });
          player.addListener('ready', ({ device_id }) => {
            this.device = {
              deviceId: device_id,
              player,
              accessToken
            };
            resolve(this.device);
          });
          const fail = (error: Spotify.Error) => {
            console.error(error.message);
            resolve(null);
          };
          player.addListener('not_ready', ({ device_id }) => {
            this.router.navigate(['home']);
          });
          player.addListener('initialization_error', fail);
          player.addListener('authentication_error', fail);
          player.addListener('account_error', fail);
          player.addListener('player_state_changed',
            state => this.zone.run(async () => {
              Tone.Transport.seconds = state.position / 1000.0;
            }));
          player.connect()
            .then(success => {
              if (!success)
                fail({ message: 'Spotify Web Playback SDK failed to connect.' });
            });
        }
      }
    });
  }
  private readonly endpoints = {
    play: 'https://api.spotify.com/v1/me/player/play',
    pause: 'https://api.spotify.com/v1/me/player/pause'
  }
  private endpoint(key: keyof typeof this.endpoints, device: ISpotifyDevice) {
    return `${this.endpoints[key]}?device_id=${device.deviceId}`;
  }
  private async do(
    device: ISpotifyDevice,
    endpoint: keyof typeof this.endpoints,
    body?: unknown) {
    if (device) {
      await device.player.activateElement();
      return new Promise<boolean>(async (resolve, reject) => {
        this.http.put(this.endpoint(endpoint, device), body, {
          headers: { Authorization: `Bearer ${device.accessToken}` },
          observe: 'response'
        }).subscribe(response => {
          resolve(response.ok);
        });
      });
    }
    else return false;
  }
  async play(device: ISpotifyDevice, spotifyId: string, seconds?: number) {
    await device.player.connect();
    return await this.do(device, 'play', {
      uris: [`spotify:track:${spotifyId}`],
      position_ms: seconds && seconds * 1000
    });
  }
  async pause(device: ISpotifyDevice) {
    const state = await device.player.getCurrentState();
    if (state?.paused) return true;
    return await this.do(device, 'pause');
  }
}
