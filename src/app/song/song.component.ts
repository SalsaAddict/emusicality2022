import {
  AfterViewChecked,
  Component,
  NgZone,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Color } from '../colors';
import { Player } from '../player';
import { Current } from './current';
import { Measure, Section, Song } from './song';
import { SpotifyService } from '../spotify/spotify.service';

@Component({
  selector: 'app-song',
  templateUrl: './song.component.html',
  styleUrls: ['./song.component.css']
})
export class SongComponent implements OnInit, AfterViewChecked, OnDestroy {
  constructor(
    route: ActivatedRoute,
    private readonly zone: NgZone,
    spotify: SpotifyService
  ) {
    this.song = route.snapshot.data['song'];
    const tone = route.snapshot.data['tone'];
    const device = route.snapshot.data['device'];
    this.player = new Player(this.zone, this.song, spotify, device);
    this.current = new Current(this.song, this.player);
    window.addEventListener('resize', this.resize);
  }
  ngOnInit() {
    this.first();
  }
  ngAfterViewChecked() {
    this.resize();
  }
  ngOnDestroy(): void {
    this.player.dispose();
  }
  public readonly song: Song;
  public readonly player: Player;
  public readonly current: Current;

  //#region Layout
  public get portrait() {
    return window.innerHeight > window.innerWidth;
  }
  public get landscape() {
    return window.innerHeight <= window.innerWidth;
  }
  private resize = () => {
    this.zone.run(() => {
      let width = window.innerWidth,
        height = window.innerHeight,
        container = document.getElementById('container') as HTMLDivElement,
        header = document.getElementById('header') as HTMLDivElement,
        image = header.childNodes[0] as HTMLImageElement,
        info = header.childNodes[1] as HTMLDivElement,
        bpm = header.childNodes[2] as HTMLDivElement,
        body = document.getElementById('body') as HTMLDivElement,
        tracks = document.getElementById('tracks') as HTMLDivElement,
        breakdown = document.getElementById('breakdown') as HTMLDivElement,
        footer = document.getElementById('footer') as HTMLDivElement;
      container.style.width =
        header.style.width =
        body.style.width =
        footer.style.width =
          `${width}px`;
      container.style.height = `${height}px`;
      info.style.width = `${width - image.offsetWidth - bpm.offsetWidth}px`;
      body.style.height = `${
        height - header.offsetHeight - footer.offsetHeight
      }px`;
      let portrait = [
          'flex-row',
          'flex-wrap',
          'justify-content-center',
          'align-items-end',
          'tracks-portrait'
        ],
        landscape = [
          'flex-shrink-1',
          'flex-column',
          'align-items-stretch',
          'tracks-landscape'
        ];
      if (height > width) {
        body.classList.add('flex-column-reverse');
        tracks.classList.remove(...landscape);
        tracks.classList.add(...portrait);
      } else {
        body.classList.remove('flex-column-reverse');
        tracks.classList.remove(...portrait);
        tracks.classList.add(...landscape);
      }
    });
  };
  //#endregion

  //#region Render
  get spotifyUrl() {
    return `https://open.spotify.com/track/${this.song.spotifyId}`;
  }
  public highlightedBlock?: string;
  public blockHighlight(event: Event, block?: string) {
    event.stopPropagation();
    event.preventDefault();
    this.highlightedBlock = block;
  }
  public sectionColor(section: Section): Color {
    if (this.highlightedBlock)
      return section.title === this.highlightedBlock
        ? section.color
        : Color.Gray;
    else if (this.player.loop)
      return section === this.current.section ? section.color : Color.Gray;
    else return section.color;
  }
  public sectionWidth(section: Section): string {
    return `${(section.length / this.song.length) * 100}%`;
  }
  public sectionProgress(section: Section): string {
    switch (this.current.state(section)) {
      case -1:
        return '0%';
      case 1:
        return '100%';
      default:
        return `${
          ((this.current.beats - section.startIndex + 1) / section.length) * 100
        }%`;
    }
  }
  public dimmed(block: string | Section): boolean {
    let title = typeof block === 'string' ? block : block.title;
    if (this.highlightedBlock) return this.highlightedBlock !== title;
    if (!this.current.section) return false;
    if (typeof block !== 'string')
      return this.player.loop && block !== this.current.section;
    return this.current.section.title !== title;
  }
  public phraseColor(phrase: Measure[]): Color {
    return this.current.state(phrase) === 0
      ? this.current.section!.color
      : Color.Gray;
  }
  public markers(): number[] {
    return [1, 2, 3, 4, 5, 6, 7, 8].slice(0, this.current.measure?.length ?? 0);
  }
  animateBeat(beat: number) {
    switch (this.song.genre) {
      case 'Salsa':
        return false;
      default:
        return beat === this.current.beat;
    }
  }
  //#endregion

  //#region Transport
  public async first() {
    await this.player.seek(0);
  }
  public async previous() {
    if (this.current.phrase) {
      let pi = this.current.section!.phrases.indexOf(this.current.phrase!);
      if (pi > 0) {
        await this.player.seek(
          this.current.section!.phrases[pi - 1][0].startIndex
        );
        return;
      } else {
        let si = this.song.sections.indexOf(this.current.section!);
        if (si > 0) {
          let s = this.song.sections[si - 1];
          await this.player.seek(s.phrases[s.phrases.length - 1][0].startIndex);
          return;
        }
      }
    }
    await this.player.seek(0);
  }
  public async next() {
    if (!this.current.phrase) return;
    let si = this.song.sections.indexOf(this.current.section!),
      pi = this.current.section!.phrases.indexOf(this.current.phrase!);
    if (pi < this.current.section!.phrases.length - 1) {
      await this.player.seek(
        this.current.section!.phrases[pi + 1][0].startIndex
      );
      return;
    } else {
      if (si < this.song.sections.length - 1) {
        await this.player.seek(
          this.song.sections[si + 1].phrases[0][0].startIndex
        );
        return;
      }
    }
  }
  public async last() {
    let s = this.song.sections[this.song.sections.length - 1];
    await this.player.seek(s.phrases[s.phrases.length - 1][0].startIndex);
  }
  public loop() {
    if (!this.player.loop) {
      if (this.current.section) {
        this.player.loopStart(
          this.current.section.startIndex,
          this.current.section.endIndex + 1
        );
      }
    } else this.player.loopEnd();
  }
  //#endregion
}
