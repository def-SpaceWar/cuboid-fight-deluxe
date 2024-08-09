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
    getLeaderboardTable(players: Player[]): HTMLTableElement;
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

    getLeaderboardTable(players: Player[]): HTMLTableElement {
        const table = document.createElement("table");
        {
            const row = table.appendChild(document.createElement("tr"));
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = "Player";
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = "Kills";
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = "Deaths";
            }
        }

        const sortedPlayers: Player[] = [];
        for (let i = 0; i < players.length; i++) {
            sortedPlayers.push(players[i]);
            for (let j = 1; j < sortedPlayers.length; j++) {
                const left = sortedPlayers[j - 1],
                    right = sortedPlayers[j];
                if (
                    right.kills > left.kills ||
                    (right.kills == left.kills && right.deaths < left.deaths)
                ) {
                    sortedPlayers[j - 1] = right;
                    sortedPlayers[j] = left;
                    if (j > 2) j -= 2;
                }
            }
        }

        for (let i = 0; i < sortedPlayers.length; i++) {
            const player = sortedPlayers[i],
                row = table.appendChild(document.createElement("tr"));
            row.style.color = player.color.toCSS();
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = player.name;
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = player.kills.toFixed(0);
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = player.deaths.toFixed(0);
            }
        }

        return table;
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
        let winners: Player[] = [];
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.lives <= 0) continue;
            winners.push(player);
        }
        switch (winners.length) {
            case 0:
                return { type: 'none' };
            case 1:
                return { type: 'player', player: winners[0] };
        }
        return { type: 'players', players: winners };
    }

    getLeaderboardTable(players: Player[]): HTMLTableElement {
        const table = document.createElement("table");
        {
            const row = table.appendChild(document.createElement("tr"));
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = "Player";
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = "Kills";
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = "Lives";
            }
        }

        const sortedPlayers: Player[] = [];
        for (let i = 0; i < players.length; i++) {
            sortedPlayers.push(players[i]);
            for (let j = 1; j < sortedPlayers.length; j++) {
                const left = sortedPlayers[j - 1],
                    right = sortedPlayers[j];
                if (
                    right.lives > left.lives ||
                    (right.lives == left.lives && right.kills > left.kills)
                ) {
                    sortedPlayers[j - 1] = right;
                    sortedPlayers[j] = left;
                    if (j > 2) j -= 2;
                }
            }
        }

        for (let i = 0; i < sortedPlayers.length; i++) {
            const player = sortedPlayers[i],
                row = table.appendChild(document.createElement("tr"));
            row.style.color = player.color.toCSS();
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = player.name;
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = player.kills.toFixed(0);
            }
            {
                const cell = row.appendChild(document.createElement("td"));
                cell.innerText = player.lives.toFixed(0);
            }
        }

        return table;
    }
}
