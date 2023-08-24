import { EventEmitter, NgZone } from "@angular/core";
import { Song } from "./song/song";
import { ALL } from "src/schema/schema";
import { PlayerTrack } from "./player-track";
import unmuteIosAudio from "unmute-ios-audio";
import * as Tone from "tone";
import { ISpotifyDevice, SpotifyService as SpotifyService } from "./spotify/spotify.service";
import { Unit } from "tone";

export class Player {
  constructor(
    private readonly zone: NgZone,
    private readonly song: Song,
    private readonly spotify: SpotifyService,
    private readonly device?: ISpotifyDevice) {
    Tone.Transport.bpm.value = song.bpm;
    this.players = new Tone.Players();
    this.tracks = [];
    song.tracks.forEach((track, index) =>
      this.tracks.push(new PlayerTrack(this.players, index, track, song.trim))
    );
    Tone.Transport.schedule(() => {
      zone.run(async () => {
        if (this.device) await this.spotify.pause(this.device);
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
        this.emitBeats();
        this.emitSeconds();
      });
    }, this.beatsToSeconds(song.endIndex + 8) + song.lag);
    this.beats = new EventEmitter();
    this.emit(this.emitBeats, "4n", this.song.lag);
    this.seconds = new EventEmitter();
    this.emit(this.emitSeconds, 1);
  }

  private readonly players;
  public readonly tracks: PlayerTrack[];

  //#region Emit
  private emit(callback: () => void, interval: Unit.Time, lag = 0) {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        this.zone.run(callback);
      }, time);
    }, interval).start(lag);
  }
  public readonly beats: EventEmitter<number>;
  private emitBeats = () => {
    let time: number = Tone.Transport.seconds;
    time = Tone.TransportTime(time - this.song.lag).quantize("4n");
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

  private fadeDefault: Unit.Time = "8n";
  public async play(fadeIn: Unit.Time = this.fadeDefault) {
    unmuteIosAudio();
    if (this.device) await this.device.player.activateElement();
    await Tone.start();
    if (this.device) {
      await this.spotify.play(this.device, this.song.spotifyId!, Tone.Transport.seconds);
    }
    else {
      let fadeTime = Tone.TransportTime(fadeIn).toSeconds();
      this.players.fadeIn = Tone.Transport.seconds > fadeTime ? fadeTime : 0;
    }
    Tone.Transport.start();
  }
  public async pause(fadeOut: Unit.Time = this.fadeDefault) {
    this.players.fadeOut = Tone.TransportTime(fadeOut).toSeconds();
    Tone.Transport.pause();
    if (this.device) await this.spotify.pause(this.device);
  }

  private beatsToSeconds(beats: number): number {
    return Tone.TransportTime("4n").toSeconds() * (beats - 1);
  }
  public async seek(beats: number) {
    Tone.Transport.loop = false;
    const seconds = beats > 0 ? this.beatsToSeconds(beats) + this.song.lag : 0;
    if (this.device && this.playing)
      await this.spotify.play(this.device, this.song.spotifyId!, seconds);
    Tone.Transport.seconds = seconds;
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

