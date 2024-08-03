import { Player } from "./player";

export type Gamemode = KillsGamemode | LivesGamemode;

export function getGamemode(): Gamemode {
    return new Stock(3);
}

export type Winner
    = { type: 'none' }
    | { type: 'player', player: Player }
    | { type: 'players', players: Player[] };
//  | { type: 'players', tie: true, players: Player[] }
//  | { type: 'team', team: Team }
//  | { type: 'teams', teams: Team[] };

export interface GamemodeBase {
    readonly isTeamMode: boolean;
    readonly secondDisplay: 'deaths' | 'lives';
    isGameOver(players: Player[]): boolean;
    getWinnerData(players: Player[]): Winner;
}

export interface KillsGamemode extends GamemodeBase {
    readonly secondDisplay: 'deaths';
    readonly kills: number;
}

export interface LivesGamemode extends GamemodeBase {
    readonly secondDisplay: 'lives';
    readonly lives: number;
}

export class Deathmatch implements KillsGamemode {
    readonly secondDisplay = 'deaths';
    readonly isTeamMode = false;
    constructor(public readonly kills: number) { }

    isGameOver(players: Player[]) {
        for (let i = 0; i < players.length; i++)
            if (players[i].kills >= this.kills) return true;
        return false;
    }

    getWinnerData(players: Player[]): Winner {
        let winners: Player[] = [];
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.kills < this.kills) continue;
            winners.push(player);
        }
        switch (winners.length) {
            case 0: return { type: 'none' };
            case 1: return { type: 'player', player: winners[0] };
        }
        return { type: 'players', players: winners };
    }
}

export class Stock implements LivesGamemode {
    readonly secondDisplay = 'lives';
    readonly isTeamMode = false;
    constructor(public readonly lives: number) { }

    isGameOver(players: Player[]) {
        let alivePlayers = 0;
        for (let i = 0; i < players.length; i++)
            // @ts-ignore
            alivePlayers += (players[i].lives > 0)
        return alivePlayers <= 1;
    }

    getWinnerData(players: Player[]): Winner {
        let alivePlayers: Player[] = [];
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.lives <= 0) continue;
            alivePlayers.push(player);
        }
        switch (alivePlayers.length) {
            case 0:
                return { type: 'none' };
            case 1:
                return { type: 'player', player: alivePlayers[0] };
        }
        return { type: 'players', players: alivePlayers };
    }
}
