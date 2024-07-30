export type Gamemode
    = {
        type: 'deathmatch',
        kills: number,
        teams: boolean,
    }
    | {
        type: 'stock',
        lives: number,
        teams: boolean,
    };
