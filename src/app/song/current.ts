import { IRange } from "src/schema/schema";
import { isArray } from "tone";
import { Player } from "../player";
import { Measure, Section, Song } from "./song";

export class Current {
  constructor(private readonly song: Song, private readonly player: Player) {
    this.player.beats.subscribe(this.synchronize);
  }
  public beats: number = 0;
  public section?: Section;
  public phrase?: Measure[];
  public measure?: Measure;
  public beat?: number;
  private synchronize = (beats: number) => {
    this.beats = beats;
    if (!this.active(this.section)) {
      this.section = this.phrase = this.measure = this.beat = undefined;
      for (let i = 0; i < this.song.sections.length; i++) {
        if (this.active(this.song.sections[i])) {
          this.section = this.song.sections[i];
          break;
        }
      }
    }
    if (this.section && !this.active(this.phrase)) {
      this.phrase = this.measure = this.beat = undefined;
      for (let i = 0; i < this.section.phrases.length; i++) {
        if (this.active(this.section.phrases[i])) {
          this.phrase = this.section.phrases[i];
          break;
        }
      }
    }
    if (this.phrase && !this.active(this.measure)) {
      this.measure = this.beat = undefined;
      for (let i = 0; i < this.phrase.length; i++) {
        if (this.active(this.phrase[i])) {
          this.measure = this.phrase[i];
          break;
        }
      }
    }
    if (this.measure) {
      this.beat = beats - this.measure.startIndex + 1;
    }
  };
  public state(range?: IRange | IRange[]): -1 | 0 | 1 | undefined {
    if (!range) return;
    let startIndex = isArray(range) ? range[0].startIndex : range.startIndex,
      endIndex = isArray(range)
        ? range[range.length - 1].endIndex
        : range.endIndex;
    if (this.beats < startIndex) return -1;
    else if (this.beats > endIndex) return 1;
    else return 0;
  }
  public active(range?: IRange | IRange[]): boolean {
    return this.state(range) === 0;
  }
}
