import { getPlayers } from "./player";
import { Gamemode, getGamemode } from "./gamemode";
import { GrassPlatform, resolvePlatformPlayerCollisions, StonePlatform } from "./platform";
import { Vector2D } from "./math";
import { clearScreen, createEndScreen } from "./render";
import { renderParticles } from "./particle";
import { isPressed, listenToInput, stopListeningToInput } from "./input";
import { renderLoop, timeout, updateLoop } from "./loop";
import { toggleHitboxes } from "./flags";
import { MainMenu, Scene } from "./scene";

export interface GameMap extends Scene {
    readonly gamemode: Gamemode;
    getRespawnPoint(): Vector2D;
}

const map1LightAngle = 7 * Math.PI / 11;
export class Map1 implements GameMap {
    readonly gamemode: Gamemode;
    constructor() { this.gamemode = getGamemode(); }

    platforms = [
        new StonePlatform(Vector2D.xy(0, 150), 200, 25, map1LightAngle),
        new GrassPlatform(Vector2D.xy(-100, 300), 500, 100, map1LightAngle),
        new StonePlatform(Vector2D.xy(500, 50), 150, 15, map1LightAngle),
        new GrassPlatform(Vector2D.xy(-300, -200), 300, 45, map1LightAngle),
        new GrassPlatform(Vector2D.xy(-100, -300), 300, 35, map1LightAngle),
        new GrassPlatform(Vector2D.xy(300, -100), 300, 35, map1LightAngle),
        new StonePlatform(Vector2D.xy(500, 300), 350, 200, map1LightAngle),
    ];

    respawnPoints = [
        Vector2D.x(-50),
        Vector2D.x(375),
        Vector2D.x(475),
        Vector2D.x(-200),
    ];

    getRespawnPoint(): Vector2D {
        return this.respawnPoints[(Math.random() * 4) | 0];
    }

    async run() {
        listenToInput();
        let players = getPlayers(this);

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            player.map = this;
            player.physicsBody.pos
                .av(this.respawnPoints[players[i].number - 1]);
        }

        let gameOver = false;

        return await new Promise<Scene>(resolve => {
            const stopRender = renderLoop((dt: number) => {
                const platforms = this.platforms;
                clearScreen();

                for (let i = 0; i < platforms.length; i++)
                    platforms[i].renderShadow();
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

                if (gameOver) return;
                if (!(gameOver = this.gamemode.isGameOver(players))) return;

                timeout(() => {
                    stopListeningToInput();
                    const removeEndScreen = createEndScreen(
                        players.length,
                        this.gamemode.getWinnerData(players),
                        this.gamemode.getLeaderboardTable(players),
                        () => {
                            for (let i = 0; i < players.length; i++)
                                players[i].onDestroy();
                            // @ts-ignore
                            players = null;

                            stopRender();
                            stopUpdate();
                            removeEndScreen();
                            resolve(new Map1());
                        },
                        () => {
                            for (let i = 0; i < players.length; i++)
                                players[i].onDestroy();
                            // @ts-ignore
                            players = null;

                            stopRender();
                            stopUpdate();
                            removeEndScreen();
                            resolve(new MainMenu());
                        }
                    );
                }, 2);
            });
        });
    }
}
