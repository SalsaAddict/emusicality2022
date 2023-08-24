import { Inject, Injectable, NgZone } from '@angular/core';
import { SpotifyTokens } from './spotify/spotify-auth.service';
import { firstValueFrom, noop } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { IBreakdown, ISongs } from 'src/schema/schema';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly http: HttpClient) {
    this.storage = this.document.defaultView!.localStorage;
    this.setValue('count', this.count + 1);
    this.document.defaultView?.addEventListener('online', noop);
    this.document.defaultView?.addEventListener('offline', noop);
  }
  private readonly keys = {
    count: 'count',
    redirectPath: 'redirectPath',
    spotifyEnabled: 'spotify:enabled',
    spotifyHidden: 'spotify:hidden',
    spotifyTokens: 'spotify:tokens'
  }
  private readonly storage: Storage;
  private setValue<T>(key: keyof typeof this.keys, value: T | null) {
    if (value === null)
      this.storage.removeItem(this.keys[key]);
    else
      this.storage.setItem(this.keys[key], JSON.stringify(value));
  }
  private getValue<T>(key: keyof typeof this.keys): T | null {
    const value = this.storage.getItem(this.keys[key]);
    return typeof value === 'string' ? JSON.parse(value) : null;
  }
  get isOnline() {
    return this.document.defaultView?.navigator.onLine ?? false;
  }
  get count() {
    return this.getValue<number>('count') ?? 0;
  }
  set redirectPath(value: string) {
    this.setValue('redirectPath', value);
  }
  get redirectPath() {
    return this.getValue('redirectPath') ?? '/home';
  }
  set spotifyEnabled(value: boolean) {
    this.setValue('spotifyEnabled', value);
  }
  get spotifyEnabled() {
    if (this.isOnline)
      return this.getValue('spotifyEnabled') ?? false;
    else
      return false;
  }
  set spotifyHidden(value: boolean) {
    this.setValue('spotifyHidden', value);
  }
  get spotifyHidden() {
    if (this.spotifyEnabled)
      return this.getValue('spotifyHidden') ?? false;
    else
      return true;
  }
  set spotifyTokens(value: SpotifyTokens) {
    this.setValue('spotifyTokens', value);
  }
  get spotifyTokens() {
    return this.getValue('spotifyTokens');
  }
  async iSongs() {
    return await firstValueFrom(
      this.http.get<ISongs>('/assets/songs/songs.json')
    );
  }
  async iSong(songId: string) {
    const iSongs = await this.iSongs();
    return iSongs[songId];
  }
  async iBreakdown(songId: string) {
    return await firstValueFrom(
      this.http.get<IBreakdown>(`/assets/songs/${songId}/breakdown.json`)
    );
  }
}
