// @ts-ignore:
import map1BgImg from "./assets/backgrounds/bg1.png";
import {
    Controls,
    getPlayers,
    parseRawInput,
    PREDICTED,
    RawPlayerInput,
} from "./player.ts";
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
    GameState,
    isRollbacking,
    renderLoop,
    setUpdateLoop,
    tickTimers,
    timeout,
    UpdateLoop,
    updateLoop,
} from "./loop.ts";
import { toggleHitboxes } from "./flags.ts";
import { JoinOrCreateLobby, Scene } from "./scene.ts";
import { connections, isHosting } from "./networking.ts";

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
        return this.respawnPoints[updateLoop.gameTick % 4];
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
            let gameOver = false,
                canToggleHitboxes = true;
            const map = (() => this)(), // gets rid of annoying warning
                platforms = this.platforms;

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

            const initialState = {
                playerStates: players.map((p) => p.saveState()),
            };
            type State = typeof initialState;
            const initialInput = [0, 0] as RawPlayerInput[];
            type Input = typeof initialInput;

            const localControls = isHosting
                ? [
                    new Controls({
                        left: { key: "s" },
                        up: { key: "e" },
                        down: { key: "d" },
                        right: { key: "f" },
                        attack: { key: "w" },
                        special: { key: "q" },
                    }, 1),
                ]
                : [
                    new Controls({
                        left: { key: "s" },
                        up: { key: "e" },
                        down: { key: "d" },
                        right: { key: "f" },
                        attack: { key: "w" },
                        special: { key: "q" },
                    }, 2),
                ];

            const saveState = (
                state: State,
                inputs: Input,
            ): GameState<State, Input> => {
                return {
                    state: {
                        ...state,
                        playerStates: players.map((p) => p.saveState()),
                    },
                    // TODO: make better
                    inputs: inputs.map((i) => i | PREDICTED),
                };
            };
            let removeEndScreen: () => void;

            const parkedInputs = new Map<number, {
                [playerNum: number]: RawPlayerInput | undefined;
            }>();
            for (const connection of connections) {
                const otherConnections = connections.filter((c) =>
                    c != connection
                );
                connection.datachannel!.onmessage = (e) => {
                    if (!isHosting && e.data == "restart") {
                        console.log("RESTARTING");
                        for (let i = 0; i < players.length; i++) {
                            players[i].onDestroy();
                        }
                        // @ts-ignore:
                        players = null;

                        stopRender();
                        updateLoop.stop();
                        removeEndScreen();
                        resolve(new Map1());
                        return;
                    }

                    const data: {
                        tick: number;
                        inputs: RawPlayerInput[];
                    } = JSON.parse(e.data);
                    if (data.inputs) {
                        if (isHosting) {
                            otherConnections.forEach((c) =>
                                c.sendMessage(e.data)
                            );
                        }

                        if (data.tick >= updateLoop.gameTick) {
                            parkedInputs.set(data.tick, data.inputs);
                            return;
                        }

                        let match = true;
                        for (const idx in data.inputs) {
                            if (
                                data.inputs[idx] ==
                                    (updateLoop as UpdateLoop<State, Input>)
                                            .inputStates[
                                                data.tick - updateLoop.startTick
                                            ].inputs[idx] - PREDICTED
                            ) {
                                (updateLoop as UpdateLoop<State, Input>)
                                    .inputStates[
                                        data.tick - updateLoop.startTick
                                    ].inputs[idx] = data.inputs[idx];
                                continue;
                            }
                            match = false;
                        }
                        if (match) return;
                        (updateLoop as UpdateLoop<State, Input>).rollback(
                            data.tick,
                            ({ state, inputs }) => {
                                return {
                                    state,
                                    inputs: inputs.map((input, idx) =>
                                        data.inputs[idx] != undefined
                                            ? data.inputs[idx]
                                            : input
                                    ),
                                };
                            },
                        );
                    }
                };
            }

            setUpdateLoop(
                new (class extends UpdateLoop<State, Input> {
                    getInput(
                        { state, inputs }: GameState<State, Input>,
                    ): GameState<State, Input> {
                        const inputsToSend = {};
                        for (let i = 0; i < inputs.length; i++) {
                            inputs[i] = inputs[i] & PREDICTED;
                        }
                        for (const control of localControls) {
                            // @ts-ignore:
                            inputsToSend[control.playerNumber - 1] =
                                inputs[control.playerNumber - 1] =
                                    control.getInput();
                        }
                        const future = parkedInputs.get(updateLoop.gameTick);
                        if (future) {
                            for (const i in future) {
                                inputs[i] = future[i]!;
                            }
                            parkedInputs.delete(updateLoop.gameTick);
                        }
                        for (const connection of connections) {
                            connection.sendMessage(
                                JSON.stringify({
                                    tick: updateLoop.gameTick,
                                    inputs: inputsToSend,
                                }),
                            );
                        }
                        return { state, inputs };
                    }
                    tick(
                        { state, inputs }: GameState<State, Input>,
                    ): GameState<State, Input> {
                        for (let i = 0; i < players.length; i++) {
                            players[i].restoreState(state.playerStates[i]);
                        }

                        tickTimers();
                        resolvePlatformPlayerCollisions(platforms, players);

                        for (let i = 0; i < platforms.length; i++) {
                            platforms[i].update();
                        }

                        for (let i = 0; i < players.length; i++) {
                            players[i].update(
                                parseRawInput(inputs[players[i].number - 1]),
                            );
                        }

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
                                players[i].takeDamage(1, {
                                    type: "environment",
                                });
                            }
                        }

                        if (canToggleHitboxes && isPressed("Escape")) {
                            canToggleHitboxes = false;
                            timeout(() => canToggleHitboxes = true, .2);
                            toggleHitboxes();
                        }

                        if (isRollbacking) return saveState(state, inputs);
                        if (gameOver) return saveState(state, inputs);
                        if (!(gameOver = map.gamemode.isGameOver(players))) {
                            return saveState(state, inputs);
                        }

                        setTimeout(() => {
                            stopListeningToInput();
                            removeEndScreen = createEndScreen(
                                players.length,
                                map.gamemode.getWinnerData(players),
                                map.gamemode.getLeaderboardTable(players),
                                () => {
                                    for (let i = 0; i < players.length; i++) {
                                        players[i].onDestroy();
                                    }
                                    // @ts-ignore:
                                    players = null;

                                    stopRender();
                                    updateLoop.stop();
                                    removeEndScreen();
                                    resolve(new Map1());

                                    for (const connection of connections) {
                                        connection.sendMessage("restart");
                                    }
                                },
                                () => {
                                    for (let i = 0; i < players.length; i++) {
                                        players[i].onDestroy();
                                    }
                                    // @ts-ignore:
                                    players = null;

                                    stopRender();
                                    updateLoop.stop();
                                    removeEndScreen();
                                    resolve(new JoinOrCreateLobby());
                                },
                            );
                        }, 2_000);

                        return saveState(state, inputs);
                    }
                    mergeStates(
                        incoming: GameState<State, Input>,
                        old: GameState<State, Input>,
                    ): GameState<State, Input> {
                        for (let i = 0; i < incoming.inputs.length; i++) {
                            if (
                                (old.inputs[i] & PREDICTED) != old.inputs[i]
                            ) {
                                incoming.inputs[i] = old.inputs[i];
                            }
                        }
                        return incoming;
                    }
                })({ state: initialState, inputs: initialInput }),
            );
        });
    }
}
