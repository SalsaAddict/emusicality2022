import { EventEmitter, NgZone } from "@angular/core";
import { Song, Track } from "./song/song";
import { ALL } from "src/schema/schema";
import { PlayerTrack } from "./player-track";
import { SpotifyService } from "./spotify.service";
import unmuteIosAudio from "unmute-ios-audio";
import * as Tone from "tone";

export class Player {
  constructor(
    private readonly zone: NgZone,
    private readonly spotify: SpotifyService,
    private readonly song: Song) {
    Tone.Transport.bpm.value = song.bpm;
    this.players = new Tone.Players();
    this.tracks = [];
    song.tracks.forEach((track, index) =>
      this.tracks.push(new PlayerTrack(this.players, index, track, song.trim))
    );
    Tone.Transport.schedule(() => {
      let stop = () => {
        Tone.Transport.stop();
        Tone.Transport.seconds = 0;
        this.emitBeats();
        this.emitSeconds();
      };
      zone.run(() => {
        if (this.song.spotifyId) {
          this.spotify.pause()
            .then(_ => { stop() });
        }
        else stop();
      });
    }, this.beatsToSeconds(song.endIndex + 8) + song.lag);
    this.beats = new EventEmitter();
    this.emit(this.emitBeats, "4n", this.song.lag);
    this.seconds = new EventEmitter();
    this.emit(this.emitSeconds, 1);
  }
  private readonly players: Tone.Players;
  public readonly tracks: PlayerTrack[];

  //#region Emit
  private emit(callback: () => void, interval: Tone.Unit.Time, lag = 0) {
    new Tone.Loop((time) => {
      Tone.Draw.schedule(() => {
        this.zone.run(callback);
      }, time);
    }, interval).start(lag);
  }
  public readonly beats: EventEmitter<number>;
  private skew = () => {
    if (!this.song.spotifyId) return;
    const tolerance = 0.15;
    const toneTime = Tone.Transport.seconds;
    const spotifyTime = this.spotify.seconds;
    const skew = Math.abs(toneTime - spotifyTime)
    if (this.playing && skew > tolerance) {
      console.warn(`Clock skew is greater than ${tolerance} secs.`,
        { skew, toneTime, spotifyTime });
    }
  }
  private emitBeats = () => {
    this.skew();
    let time: number = Tone.Transport.seconds;
    time = Tone.TransportTime(time - this.song.lag).quantize("4n");
    let bbs = Tone.TransportTime(time).toBarsBeatsSixteenths().split(":");
    this.beats.emit(parseInt(bbs[0]) * 4 + parseInt(bbs[1]) + 1);
  };
  public readonly seconds: EventEmitter<Date>;
  private emitSeconds = () => {
    this.skew();
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
    unmuteIosAudio();
    Tone.start().then(_ => {
      if (this.song.spotifyId) {
        this.spotify.play(this.song.spotifyId, Tone.Transport.seconds)
          .then(_ => {
            Tone.Transport.start();
          });
      }
      else {
        let fadeTime = Tone.TransportTime(fadeIn).toSeconds();
        this.players.fadeIn = Tone.Transport.seconds > fadeTime ? fadeTime : 0;
        Tone.Transport.start();
      }
    });
  }
  public pause(fadeOut: Tone.Unit.Time = this.fadeDefault) {
    if (this.song.spotifyId) {
      this.spotify.pause()
        .then(_ => {
          Tone.Transport.pause();
        });
    }
    else {
      this.players.fadeOut = Tone.TransportTime(fadeOut).toSeconds();
      Tone.Transport.pause();
    }
  }

  private beatsToSeconds(beats: number): number {
    return Tone.TransportTime("4n").toSeconds() * (beats - 1);
  }
  public seek(beats: number) {
    Tone.Transport.loop = false;
    const seconds = beats > 0 ? this.beatsToSeconds(beats) + this.song.lag : 0;
    const update = (seconds: number) => {
      Tone.Transport.seconds = seconds;
      this.emitBeats();
      this.emitSeconds();
    };
    if (this.song.spotifyId && this.playing) {
      this.spotify.play(this.song.spotifyId, seconds)
        .then(_ => {
          update(seconds)
        });
    }
    else update(seconds);
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

