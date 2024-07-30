import { Player } from "./player";
import { Gamemode } from "./gamemode";
import { GrassPlatform, resolvePlatformPlayerCollisions, StonePlatform } from "./platform";
import { Vector2D } from "./math";
import { clearScreen } from "./render";
import { renderParticles } from "./particle";
import { isPressed } from "./input";
import { renderLoop, timeout, updateLoop } from "./loop";
import { toggleHitboxes } from "./flags";

export interface GameMap {
    readonly gamemode: Gamemode;
    run(players: Player[]): Promise<void>;
}

export class Map1 implements GameMap {
    platforms = [
        new StonePlatform(Vector2D.xy(0, 150), 200, 25),
        new GrassPlatform(Vector2D.xy(-100, 300), 500, 100),
        new StonePlatform(Vector2D.xy(500, 50), 150, 15),
        new GrassPlatform(Vector2D.xy(-300, -200), 300, 45),
        new GrassPlatform(Vector2D.xy(-100, -300), 300, 35),
        new GrassPlatform(Vector2D.xy(300, -100), 300, 35),
        new StonePlatform(Vector2D.xy(500, 300), 350, 200),
    ];

    constructor(public gamemode: Gamemode) { }

    async run(players: Player[]) {
        // set players' spawn points

        return new Promise<void>(resolve => {
            const stopRender = renderLoop((dt: number) => {
                const platforms = this.platforms;
                clearScreen();

                for (let i = 0; i < platforms.length; i++)
                    platforms[i].render();

                for (let i = 0; i < players.length; i++)
                    players[i].render(dt);

                renderParticles(dt);

                for (let i = 0; i < players.length; i++)
                    players[i].renderUi(dt);
            });

            let canToggleHitboxes = true;
            const stopUpdate = updateLoop((dt: number) => {
                const platforms = this.platforms;
                resolvePlatformPlayerCollisions(platforms, players);

                for (let i = 0; i < platforms.length; i++)
                    platforms[i].update(dt);

                for (let i = 0; i < players.length; i++)
                    players[i].update(dt);

                if (canToggleHitboxes && isPressed("Escape")) {
                    canToggleHitboxes = false;
                    timeout(() => canToggleHitboxes = true, .2);
                    toggleHitboxes();
                }

                if (!isPressed("Enter")) return;
                // if (!gamemode.isGameOver(players)) return;

                for (let i = 0; i < players.length; i++)
                    players[i].onDestroy();

                stopRender();
                stopUpdate();
                resolve();
                // resolve(gamemode.winner(players));
            });
        });
    }
}
