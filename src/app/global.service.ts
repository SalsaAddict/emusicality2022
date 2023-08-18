import { Injectable } from "@angular/core";
import { CheckboxControlValueAccessor } from "@angular/forms";

@Injectable({ providedIn: "root" })
export class GlobalService {
  constructor() {
    window.localStorage.setItem("count", (this.count + 1).toString());
  }
  get count() {
    return parseInt(window.localStorage.getItem("count") ?? "0");
  }
  set songId(value: string | null) {
    localStorage.setItem('songId', JSON.stringify(value));
  }
  get songId() {
    const value = localStorage.getItem('songId');
    return value ? JSON.parse(value) : null;
  }
  set enableSpotify(value: boolean) {
    localStorage.setItem('enableSpotify', JSON.stringify(value));
  }
  get enableSpotify() {
    const value = localStorage.getItem('enableSpotify');
    return value ? JSON.parse(value) : false;
  }
  set hideSpotify(value: boolean) {
    localStorage.setItem('hideSpotify', JSON.stringify(value));
  }
  get hideSpotify() {
    if (!this.enableSpotify) return true;
    const value = localStorage.getItem('hideSpotify');
    return value ? JSON.parse(value) : false;
  }
  set spotify(data: SpotifyAuthData) {
    if (data)
      localStorage.setItem('spotify', JSON.stringify(data));
    else
      localStorage.removeItem('spotify');
  }
  get spotify() {
    const data = localStorage.getItem('spotify');
    return data ? JSON.parse(data) : undefined;
  }
}

export interface ISpotifyAuthCode {
  codeVerifier: string;
  state: string;
}

export function isSpotifyAuthCode(value: SpotifyAuthData): value is ISpotifyAuthCode {
  if (value)
    if ((value as ISpotifyAuthCode).state)
      return true;
  return false;
}

export interface ISpotifyToken {
  accessToken: string;
  refreshToken: string;
}

export function isSpotifyToken(value: SpotifyAuthData): value is ISpotifyToken {
  if (value)
    if ((value as ISpotifyToken).accessToken)
      return true;
  return false;
}

export type SpotifyAuthData = ISpotifyAuthCode | ISpotifyToken | undefined;
