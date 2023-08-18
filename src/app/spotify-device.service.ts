import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, RendererFactory2 } from '@angular/core';
import { HttpStatusCode } from '@angular/common/http';
import { SpotifyAuthService } from './spotify-auth.service';
import { error } from 'src/main';
import * as Tone from 'tone';

export interface ISpotifyDevice {
  deviceId: string;
  accessToken: string;
  player: Spotify.Player;
}

@Injectable({ providedIn: 'root' })
export class SpotifyDeviceService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly rendererFactory: RendererFactory2,
    private readonly spotifyAuth: SpotifyAuthService) { }

  private isWebPlaybackSDKReady = false;
  private loadWebPlaybackSDK = () => {
    return new Promise<void>((resolve, reject) => {
      if (this.isWebPlaybackSDKReady)
        resolve();
      else
        if (this.document.defaultView) {
          this.document.defaultView.onSpotifyWebPlaybackSDKReady = () => {
            this.isWebPlaybackSDKReady = true;
            resolve();
          }
          const renderer = this.rendererFactory.createRenderer(null, null);
          const script: HTMLScriptElement = renderer.createElement('script');
          script.src = "https://sdk.scdn.co/spotify-player.js";
          script.async = true;
          renderer.appendChild(this.document.body, script);
        }
        else reject(error('Window object is not available.', HttpStatusCode.InternalServerError));
    });
  }
  private device?: ISpotifyDevice;
  getDevice() {
    return new Promise<ISpotifyDevice>((resolve, reject) => {
      if (this.device)
        resolve(this.device);
      else
        this.loadWebPlaybackSDK()
          .then(_ => {
            this.spotifyAuth.getAccessToken()
              .then(accessToken => {
                const player = new Spotify.Player({
                  name: 'emusicality',
                  getOAuthToken: cb => { cb(accessToken!); },
                  volume: 1.0
                });
                player.addListener('ready', ({ device_id }) => {
                  this.device = {
                    deviceId: device_id,
                    accessToken,
                    player
                  };
                  resolve(this.device);
                });
                player.addListener('not_ready', _ => {
                  delete this.device;
                });
                player.addListener('initialization_error', ({ message }) => {
                  reject(error(message, HttpStatusCode.InternalServerError));
                });
                player.addListener('authentication_error', ({ message }) => {
                  reject(error(message, HttpStatusCode.Unauthorized));
                });
                player.addListener('account_error', ({ message }) => {
                  reject(error(message, HttpStatusCode.Unauthorized));
                });
                player.addListener('player_state_changed', this.state.update);
                player.connect()
                  .then(connected => {
                    if (!connected) {
                      reject(error('Spotify Player failed to connect.', HttpStatusCode.InternalServerError));
                    }
                  }, reject);
              }, reject);
          }, reject);
    });
  }
  private state = new class {
    private paused = false;
    private duration = 0;
    private position = 0;
    private updated = performance.now();
    update = (state: Spotify.PlaybackState) => {
      this.paused = state.paused;
      this.position = state.position;
      this.duration = state.duration;
      this.updated = performance.now();
      if (!this.paused) Tone.Transport.seconds = this.seconds;
    }
    get milliseconds() {
      if (this.paused) return this.position;
      const position = this.position + (performance.now() - this.updated);
      return position > this.duration ? this.duration : position;
    }
    get seconds() { return this.milliseconds / 1000.0; }
  }();
  get seconds() { return this.state.seconds; }
}
