import {
  ALL,
  IBreakdown,
  IPhrase,
  IPhrases,
  IRange,
  ISection,
  ISong,
  ITrackType,
  MDASH,
} from "src/schema/schema";
import { assignColors, Color, IPalette } from "../colors";

export class Song implements IRange {
  constructor(
    public readonly songId: string,
    iSong: ISong,
    iBreakdown: IBreakdown
  ) {
    this.title = iSong.title;
    this.artist = iSong.artist;
    this.genre = iSong.genre;
    this.bpm = iSong.bpm;
    this.trim = iBreakdown.trim ?? 0;
    this.imageUrl = `/assets/songs/${this.songId}/cover.jpg`;
    this.groups = [];
    this.tracks = [];
    iBreakdown.tracks.forEach((iTrack, trackId) => {
      let track = new Track(songId, trackId, iTrack);
      track.groups.forEach((group) => {
        if (!this.groups.includes(group)) this.groups.push(group);
      });
      this.tracks.push(track);
    });
    this.groups.sort();
    let index = 1;
    this.blocks = [];
    iBreakdown.sections.forEach((iSection) => {
      if (!this.blocks.includes(iSection.title))
        this.blocks.push(iSection.title);
    });
    this.legend = assignColors(this.blocks);
    this.sections = [];
    iBreakdown.sections.forEach((iSection) => {
      let s = new Section(
        index,
        iSection,
        iBreakdown.beatsPerMeasure,
        this.legend[iSection.title]
      );
      this.sections.push(s);
      index = s.endIndex + 1;
    });
    this.startIndex = 1;
    this.endIndex = index - 1;
    this.length = this.endIndex;
  }
  public readonly title: string;
  public readonly artist: string;
  public readonly genre: string;
  public readonly bpm: number;
  public readonly trim: number;
  public readonly imageUrl: string;
  public readonly groups: string[];
  public readonly tracks: Track[];
  public readonly blocks: string[];
  public readonly legend: IPalette;
  public readonly sections: Section[];
  public readonly startIndex: number;
  public readonly endIndex: number;
  public readonly length: number;
}

export class Track {
  constructor(
    songId: string,
    public readonly trackId: number,
    iTrack: ITrackType
  ) {
    this.trackId = trackId;
    this.title = typeof iTrack === "string" ? iTrack : iTrack.title;
    this.fileName = `/assets/songs/${songId}/track${trackId}.trk`;
    if (typeof iTrack !== "string" && iTrack.groups)
      this.groups =
        typeof iTrack.groups === "string" ? [iTrack.groups] : iTrack.groups;
    else this.groups = [];
    this.groups.push(ALL);
    this.groups.sort();
  }
  public readonly title: string;
  public readonly fileName: string;
  public readonly groups: string[];
}

export class Section implements IRange {
  constructor(
    startIndex: number,
    iSection: ISection,
    beatsPerMeasure: number,
    color: Color
  ) {
    this.title = iSection.title;
    this.color = color;
    let index = startIndex,
      structure = iSection.structure || MDASH;
    this.phrases = [];
    if (
      (function (iPhrases: IPhrases): iPhrases is IPhrase[] {
        if (!Array.isArray(iPhrases)) iPhrases = [iPhrases];
        return true;
      })(iSection.phrases)
    ) {
      iSection.phrases.forEach((iPhrase) => {
        let phrase: Measure[] = [];
        if (typeof iPhrase === "number") {
          for (let i = 0; i < iPhrase; i++) {
            let m = new Measure(structure!, beatsPerMeasure, false, index);
            index = m.endIndex + 1;
            phrase.push(m);
          }
        } else
          iPhrase.forEach((measure) => {
            let beats: number, warning: boolean;
            if (typeof measure === "number") {
              beats = measure;
            } else if (typeof measure === "string") {
              structure = measure ?? structure;
              beats = beatsPerMeasure;
            } else {
              structure = measure.structure ?? MDASH;
              beats = measure.beats ?? beatsPerMeasure;
            }
            warning = beats !== beatsPerMeasure;
            let m = new Measure(structure!, beats, warning, index);
            index = m.endIndex + 1;
            phrase.push(m);
          });
        this.phrases.push(phrase);
      });
    }
    this.startIndex = startIndex;
    this.endIndex = index - 1;
    this.length = this.endIndex - this.startIndex + 1;
  }
  public readonly title: string;
  public readonly color: Color;
  public readonly phrases: Measure[][];
  public readonly startIndex: number;
  public readonly endIndex: number;
  public readonly length: number;
}

export class Measure implements IRange {
  constructor(
    public readonly structure: string,
    public readonly beats: number,
    public readonly warning: boolean,
    public readonly startIndex: number
  ) {
    this.endIndex = this.startIndex + beats - 1;
    this.length = this.endIndex - this.startIndex + 1;
  }
  public readonly endIndex: number;
  public readonly length: number;
}
