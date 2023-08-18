import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { SpotifyDeviceService } from './spotify-device.service';
import SpotifyWebApi from 'spotify-web-api-js';

@Injectable({ providedIn: 'root' })
export class SpotifyService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly device: SpotifyDeviceService) { }
  private readonly api = new SpotifyWebApi();
  get seconds() { return this.device.seconds; }
  play(spotifyId: string, seconds: number) {
    return this.device.getDevice()
      .then(device => {
        this.api.setAccessToken(device.accessToken);
        return this.api.play({
          device_id: device.deviceId,
          uris: [`spotify:track:${spotifyId}`],
          position_ms: seconds * 1000.0
        });
      });
  }
  pause() {
    return this.device.getDevice()
      .then(device => {
        this.api.setAccessToken(device.accessToken);
        return this.api.pause({
          device_id: device.deviceId
        });
      });
  }
}
