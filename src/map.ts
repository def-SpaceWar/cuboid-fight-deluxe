// @ts-ignore:
import map1BgImg from "./assets/backgrounds/bg1.png";
import { getPlayers } from "./player.ts";
import { Gamemode, getGamemode } from "./gamemode.ts";
import {
    GrassPlatform,
    resolvePlatformPlayerCollisions,
    StonePlatform,
} from "./platform.ts";
import { Vector2D } from "./math.ts";
import {
    ambientGeometry,
    clearScreen,
    composeDisplay,
    createEndScreen,
    defaultRectColor,
    drawGeometry,
    generateAmbientColor,
    loadImage,
    rectToGeometry,
    renderLighting,
} from "./render.ts";
import { renderParticles } from "./particle.ts";
import { isPressed, listenToInput, stopListeningToInput } from "./input.ts";
import {
    clearTimer,
    renderLoop,
    repeatedTimeout,
    timeout,
    updateLoop,
} from "./loop.ts";
import { toggleHitboxes } from "./flags.ts";
import { JoinOrCreateLobby, Scene } from "./scene.ts";

export interface GameMap extends Scene {
    readonly gamemode: Gamemode;
    getRespawnPoint(): Vector2D;
}

const map1BgTex = await loadImage(map1BgImg),
    map1BgTexCoords = rectToGeometry([0, 0, 480, 270]),
    map1BgGeometry = rectToGeometry([-960, -540, 960, 540]);
export class Map1 implements GameMap {
    readonly gamemode: Gamemode;
    constructor() {
        this.gamemode = getGamemode();
    }

    platforms = [
        new GrassPlatform(Vector2D.xy(-300, -200), 300, 45),
        new GrassPlatform(Vector2D.xy(-100, 300), 500, 100),
        new GrassPlatform(Vector2D.xy(-100, -300), 300, 35),
        new StonePlatform(Vector2D.xy(0, 150), 200, 25),
        new GrassPlatform(Vector2D.xy(300, -100), 300, 35),
        new StonePlatform(Vector2D.xy(500, 50), 150, 15),
        new StonePlatform(Vector2D.xy(500, 300), 350, 200),
    ];

    respawnPoints = [
        Vector2D.x(-50),
        Vector2D.x(375),
        Vector2D.x(475),
        Vector2D.x(-200),
    ];

    lightGeometry = new Float32Array([
        ...ambientGeometry,

        // platform 0
        ...[.25, -1, 0, 0],
        ...[-450, -222.5, 0, 1],
        ...[-450, -177.5, 0, 1],
        ...[.25, -1, 0, 0],
        ...[-450, -177.5, 0, 1],
        ...[-150, -177.5, 0, 1],

        // platform 1
        ...[.25, -1, 0, 0],
        ...[-350, 250, 0, 1],
        ...[-350, 350, 0, 1],
        ...[.25, -1, 0, 0],
        ...[-350, 350, 0, 1],
        ...[150, 350, 0, 1],
    ]);

    lightColor = new Float32Array([
        ...generateAmbientColor([.7, .75, .8, 1]),
        ...(new Float32Array(256).fill(1)),
    ]);

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
                .av(this.respawnPoints[player.number - 1]);
        }

        return await new Promise<Scene>((resolve) => {
            let gameOver = false;
            const platforms = this.platforms;

            // TODO: remove and replace with damage areas/platforms
            const damageTimer = repeatedTimeout(() => {
                for (let i = 0; i < players.length; i++) {
                    if (
                        !players[i].isDead &&
                        (
                            players[i].physicsBody.pos.y > 1_000 ||
                            players[i].physicsBody.pos.y < -1_000 ||
                            players[i].physicsBody.pos.x > 2_000 ||
                            players[i].physicsBody.pos.x < -2_000
                        )
                    ) {
                        players[i].takeDamage(10, { type: "environment" });
                    }
                }
            }, .1);

            const stopRender = renderLoop((dt: number) => {
                clearScreen();
                drawGeometry(
                    map1BgTex,
                    map1BgTexCoords,
                    map1BgGeometry,
                    defaultRectColor,
                );

                for (let i = 0; i < platforms.length; i++) {
                    platforms[i].render();
                }

                for (let i = 0; i < players.length; i++) {
                    players[i].render(dt);
                }

                renderParticles(dt);

                renderLighting(this.lightGeometry, this.lightColor);

                composeDisplay();

                for (let i = 0; i < players.length; i++) {
                    players[i].renderUi(dt);
                }
            });

            let canToggleHitboxes = true;
            const stopUpdate = updateLoop((dt: number) => {
                const platforms = this.platforms;
                resolvePlatformPlayerCollisions(platforms, players);

                for (let i = 0; i < platforms.length; i++) {
                    platforms[i].update(dt);
                }

                for (let i = 0; i < players.length; i++) {
                    players[i].update(dt);
                }

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
                            for (let i = 0; i < players.length; i++) {
                                players[i].onDestroy();
                            }
                            // @ts-ignore:
                            players = null;

                            clearTimer(damageTimer);
                            stopRender();
                            stopUpdate();
                            removeEndScreen();
                            resolve(new Map1());
                        },
                        () => {
                            for (let i = 0; i < players.length; i++) {
                                players[i].onDestroy();
                            }
                            // @ts-ignore:
                            players = null;

                            clearTimer(damageTimer);
                            stopRender();
                            stopUpdate();
                            removeEndScreen();
                            resolve(new JoinOrCreateLobby());
                        },
                    );
                }, 2);
            });
        });
    }
}
