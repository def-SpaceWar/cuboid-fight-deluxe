export type Gamemode = KillsGamemode | LivesGamemode;

export interface GamemodeBase {
    readonly isTeamMode: boolean;
}

export interface KillsGamemode extends GamemodeBase {
    readonly displayDeathsOrLives: 'deaths';
    readonly kills: number;
}

export interface LivesGamemode extends GamemodeBase {
    readonly displayDeathsOrLives: 'lives';
    readonly lives: number;
}

export class Deathmatch implements KillsGamemode {
    readonly displayDeathsOrLives = 'deaths';
    readonly isTeamMode = false;
    constructor(public readonly kills: number) { }
}

export class Stock implements LivesGamemode {
    readonly displayDeathsOrLives = 'lives';
    readonly isTeamMode = false;
    constructor(public readonly lives: number) { }
}
