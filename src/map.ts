import { getPlayers } from "./player";
import { Gamemode, getGamemode } from "./gamemode";
import { GrassPlatform, resolvePlatformPlayerCollisions, StonePlatform } from "./platform";
import { Vector2D } from "./math";
import { clearScreen, createEndScreen } from "./render";
import { renderParticles } from "./particle";
import { isPressed, listenToInput, stopListeningToInput } from "./input";
import { renderLoop, timeout, updateLoop } from "./loop";
import { toggleHitboxes } from "./flags";

export interface GameMap {
    readonly gamemode: Gamemode;
    getRespawnPoint(): Vector2D;
    run(): Promise<GameMap>;
}

export class Map1 implements GameMap {
    gamemode: Gamemode;
    constructor() { this.gamemode = getGamemode(); }

    platforms = [
        new StonePlatform(Vector2D.xy(0, 150), 200, 25),
        new GrassPlatform(Vector2D.xy(-100, 300), 500, 100),
        new StonePlatform(Vector2D.xy(500, 50), 150, 15),
        new GrassPlatform(Vector2D.xy(-300, -200), 300, 45),
        new GrassPlatform(Vector2D.xy(-100, -300), 300, 35),
        new GrassPlatform(Vector2D.xy(300, -100), 300, 35),
        new StonePlatform(Vector2D.xy(500, 300), 350, 200),
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
        const players = getPlayers(this);

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            player.map = this;
            player.physicsBody.pos
                .av(this.respawnPoints[players[i].number - 1]);
        }

        let gameOver = false;

        return new Promise<GameMap>(resolve => {
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

                if (gameOver) {
                    // render stuff
                }
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
                        this.gamemode.getWinnerData(players),
                        () => {
                            for (let i = 0; i < players.length; i++)
                                players[i].onDestroy();

                            stopRender();
                            stopUpdate();
                            removeEndScreen();
                            resolve(new Map1());
                        },
                        () => {
                            for (let i = 0; i < players.length; i++)
                                players[i].onDestroy();

                            stopRender();
                            stopUpdate();
                            removeEndScreen();
                            alert("No main menu yet.");
                            // resolve(new MainMenu()); or smth like that
                        }
                    );
                }, 2);
            });
        });
    }
}
