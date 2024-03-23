export const MDASH = '&mdash;';
export const ALL = MDASH + ' All ' + MDASH;
export interface ISongs {
  [songId: string]: ISong;
}
export interface ISong {
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  dateAdded: Date;
  spotify?: true;
  hidden?: true;
}
export interface IBreakdown {
  lag?: number;
  trim?: number;
  beatsPerMeasure: number;
  tracks: ITracks;
  sections: ISection[];
}
export function isSpotifyTrack(iTracks: ITracks): iTracks is string {
  return typeof iTracks === 'string';
}
export type ITracks = ITrackType[] | string;
export type ITrackType = string | ITrack;
export interface ITrack {
  title: string;
  groups?: string | string[];
  trim?: number;
}
export interface ISection {
  title: string;
  structure?: string;
  phrases: IPhrases;
}
export type IPhrases = IPhrase[];
export type IPhrase = number | (string | number | IMeasure)[];
export interface IMeasure {
  structure?: string;
  beats?: number;
  offset?: number;
}
export interface IMetadata {
  songId: string;
  iSong: ISong;
  iBreakdown: IBreakdown;
}
export interface IRange {
  startIndex: number;
  endIndex: number;
  length: number;
}
