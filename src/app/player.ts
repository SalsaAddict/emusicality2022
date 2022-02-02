import { Song, Track } from "./song/song";
import * as Tone from "tone";
import { EventEmitter, NgZone } from "@angular/core";
import { ALL } from "src/schema/schema";

export class Player {
  constructor(private readonly zone: NgZone, song: Song) {
    Tone.Transport.bpm.value = song.bpm;
    this.players = new Tone.Players();
    this.tracks = [];
    song.tracks.forEach((track, index) =>
      this.tracks.push(new PlayerTrack(this.players, index, track, song.trim))
    );
    Tone.Transport.schedule(() => {
      zone.run(() => {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
      });
    }, this.beatsToSeconds(song.endIndex + 8));
    this.beats = new EventEmitter();
    this.emit(this.emitBeats, "4n");
    this.seconds = new EventEmitter();
    this.emit(this.emitSeconds, 1);
  }
  private readonly players: Tone.Players;
  public readonly tracks: PlayerTrack[];

  //#region Emit
  private emit(callback: () => void, interval: Tone.Unit.Time) {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        this.zone.run(callback);
      }, time);
    }, interval).start(0);
  }
  public readonly beats: EventEmitter<number>;
  private emitBeats = () => {
    let time: number = Tone.Transport.seconds;
    time = Tone.TransportTime(time).quantize("4n");
    let bbs = Tone.TransportTime(time).toBarsBeatsSixteenths().split(":");
    this.beats.emit(parseInt(bbs[0]) * 4 + parseInt(bbs[1]) + 1);
  };
  public readonly seconds: EventEmitter<Date>;
  private emitSeconds = () => {
    let date = new Date(0);
    date.setSeconds(Tone.Transport.seconds);
    this.seconds.emit(date);
  };
  //#endregion

  public get loaded() {
    return this.players.loaded;
  }

  public get playing() {
    return Tone.Transport.state === "started";
  }

  private fadeDefault: Tone.Unit.Time = "8n";
  public play(fadeIn: Tone.Unit.Time = this.fadeDefault) {
    let fadeTime = Tone.TransportTime(fadeIn).toSeconds();
    this.players.fadeIn = Tone.Transport.seconds > fadeTime ? fadeTime : 0;
    Tone.start();
    Tone.Transport.start();
  }
  public pause(fadeOut: Tone.Unit.Time = this.fadeDefault) {
    this.players.fadeOut = Tone.TransportTime(fadeOut).toSeconds();
    Tone.Transport.pause();
  }

  private beatsToSeconds(beats: number): number {
    return Tone.TransportTime("4n").toSeconds() * (beats - 1);
  }
  public seek(beats: number) {
    Tone.Transport.loop = false;
    Tone.Transport.seconds = this.beatsToSeconds(beats);
    this.emitBeats();
    this.emitSeconds();
  }

  public group: string = ALL;
  public setGroup(group: string) {
    this.group = group;
    this.tracks.forEach((track) => {
      track.disabled = track.groups.indexOf(group) < 0;
    });
  }

  public get loop() {
    return Tone.Transport.loop;
  }
  public loopStart(startIndex: number, endIndex: number) {
    Tone.Transport.setLoopPoints(
      this.beatsToSeconds(startIndex),
      this.beatsToSeconds(endIndex)
    );
    Tone.Transport.loop = true;
  }
  public loopEnd() {
    Tone.Transport.loop = false;
  }
  public dispose() {
    if (this.playing) this.pause();
    Tone.Transport.cancel();
    this.tracks.forEach((track) => track.dispose());
    this.players.dispose();
  }
}

export class PlayerTrack {
  constructor(
    players: Tone.Players,
    index: number,
    track: Track,
    trim: number
  ) {
    console.log(track, trim);
    this.trackId = `player_track_${index}`;
    this.title = track.title;
    this.groups = track.groups;
    players.add(track.trackId.toString(), track.fileName);
    this.player = players.player(track.trackId.toString());
    this.player.sync().start(track.trim, trim).toDestination();
  }

  public readonly trackId: string;
  public readonly title: string;
  public readonly groups: string[];

  private readonly player: Tone.Player;

  public get loaded() {
    return this.player.loaded;
  }

  public mute() {
    this.player.mute = !this.player.mute;
  }

  public get muted() {
    return this.player.mute;
  }

  private enabled: boolean = true;
  public set disabled(value: boolean) {
    this.player.mute = value;
    this.enabled = !value;
  }
  public get disabled() {
    return !this.enabled;
  }

  public dispose() {
    this.player.dispose();
  }
}
