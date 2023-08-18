import * as Tone from 'tone';
import { Track } from './song/song';

export class PlayerTrack {
    constructor(
        players: Tone.Players,
        index: number,
        track: Track,
        trim: number
    ) {
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
