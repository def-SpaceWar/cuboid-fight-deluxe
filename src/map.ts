// @ts-ignore:
import map1BgImg from "./assets/backgrounds/bg1.png";
import {
    Controls,
    getPlayers,
    parseRawInput,
    Player,
    PREDICTED,
    RawPlayerInput,
} from "./player.ts";
import { Gamemode, getGamemode } from "./gamemode.ts";
import {
    DeathPlatform,
    GrassPlatform,
    resolvePlatformPlayerCollisions,
    StonePlatform,
    StoneWall,
} from "./platform.ts";
import { Vector2D } from "./math.ts";
import {
    clearScreen,
    composeDisplay,
    createEndScreen,
    defaultRectColor,
    drawGeometry,
    loadImage,
    rectToGeometry,
    renderLighting,
    rollbackTempHTML,
} from "./render.ts";
import { renderParticles } from "./particle.ts";
import { isPressed, listenToInput, stopListeningToInput } from "./input.ts";
import {
    GameState,
    isRollbacking,
    renderLoop,
    setUpdateLoop,
    UpdateLoop,
    updateLoop,
} from "./loop.ts";
import { DT, toggleHitboxes } from "./flags.ts";
import { JoinOrCreateLobby, Scene } from "./scene.ts";
import {
    connections,
    gameNumber,
    isHosting,
    playerNumbers,
    resetConnections,
    setGameNumber,
} from "./networking.ts";

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
        new StoneWall(Vector2D.xy(-450, 50), 45, 300),
        new GrassPlatform(Vector2D.xy(-300, -200), 300, 45),
        new GrassPlatform(Vector2D.xy(-100, 300), 500, 100),
        new GrassPlatform(Vector2D.xy(-100, -300), 300, 35),
        new StonePlatform(Vector2D.xy(0, 150), 200, 25),
        new GrassPlatform(Vector2D.xy(300, -100), 300, 35),
        new StonePlatform(Vector2D.xy(500, 50), 150, 15),
        new StonePlatform(Vector2D.xy(500, 300), 350, 200),
        new DeathPlatform(Vector2D.xy(0, 590), 2120, 100),
        new DeathPlatform(Vector2D.xy(0, -590), 2120, 100),
        new DeathPlatform(Vector2D.xy(0, -590), 2120, 100),
        new DeathPlatform(Vector2D.xy(1010, 0), 100, 1180),
        new DeathPlatform(Vector2D.xy(-1010, 0), 100, 1180),
    ];

    respawnPoints = [
        Vector2D.x(-50),
        Vector2D.x(375),
        Vector2D.x(475),
        Vector2D.x(-200),
    ];

    lightGeometry = new Float32Array([
        // left
        ...[.25, -1, 0, 0],
        ...[-960, -222.5, 0, 0],
        ...[-450, -222.5, 0, 1],
        ...[-.25, 1, 0, 0],
        ...[-960, -222.5, 0, 0],
        ...[-450, -222.5, 0, 1],

        // platform 0
        ...[.25, -1, 0, 0],
        ...[-450, -222.5, 0, 1],
        ...[-450, -177.5, 0, 1],
        ...[.25, -1, 0, 0],
        ...[-450, -177.5, 0, 1],
        ...[-285, -177.5, 0, 1],

        // platform 2
        ...[.25, -1, 0, 0],
        ...[-250, -317.5, 0, 1],
        ...[-250, -282.5, 0, 1],
        ...[.25, -1, 0, 0],
        ...[-250, -282.5, 0, 1],
        ...[50, -282.5, 0, 1],

        // platform 3
        ...[.25, -1, 0, 0],
        ...[-55, 137.5, 0, 1],
        ...[-55, 162.5, 0, 1],
        ...[.25, -1, 0, 0],
        ...[-55, 162.5, 0, 1],
        ...[80, 162.5, 0, 1],

        // platform 4
        ...[.25, -1, 0, 0],
        ...[150, -117.5, 0, 1],
        ...[150, -82.5, 0, 1],
        ...[.25, -1, 0, 0],
        ...[150, -82.5, 0, 1],
        ...[450, -82.5, 0, 1],

        // platform 6
        ...[.25, -1, 0, 0],
        ...[379, 200, 0, 1],
        ...[386, 200, 0, 1],

        // platform 5
        ...[.25, -1, 0, 0],
        ...[425, 42.5, 0, 1],
        ...[425, 57.5, 0, 1],
        ...[.25, -1, 0, 0],
        ...[425, 57.5, 0, 1],
        ...[575, 57.5, 0, 1],

        // platform 6
        ...[.25, -1, 0, 0],
        ...[538, 200, 0, 1],
        ...[538, 400, 0, 1],
        ...[.25, -1, 0, 0],
        ...[538, 400, 0, 1],
        ...[675, 400, 0, 1],

        // right
        ...[.25, -1, 0, 0],
        ...[960, 400, 0, 0],
        ...[675, 400, 0, 1],
        ...[-.25, 1, 0, 0],
        ...[960, 400, 0, 0],
        ...[675, 400, 0, 1],

        // bg
        ...[1, 0, 0, 0],
        ...[-960, -540, 0, 1],
        ...[0, 1, 0, 0],

        ...[-1, 0, 0, 0],
        ...[960, 540, 0, 1],
        ...[0, -1, 0, 0],

        ...[-1, 0, 0, 0],
        ...[960, -540, 0, 1],
        ...[0, 1, 0, 0],

        ...[1, 0, 0, 0],
        ...[-960, 540, 0, 1],
        ...[0, -1, 0, 0],

        // fade
        ...[-960, 540, 0, 1],
        ...[-960, -540, 0, 1],
        ...[960, -540, 0, 1],
        ...[960, -540, 0, 1],
        ...[-960, 540, 0, 1],
        ...[960, 540, 0, 1],

        // death
        ...[1, 0, 0, 0],
        ...[-1060, -640, 0, 1],
        ...[-1060, -540, 0, 1],
        ...[0, 1, 0, 0],
        ...[960, -640, 0, 1],
        ...[1060, -640, 0, 1],
        ...[-1, 0, 0, 0],
        ...[1060, 640, 0, 1],
        ...[1060, 540, 0, 1],
        ...[0, -1, 0, 0],
        ...[-960, 640, 0, 1],
        ...[-1060, 640, 0, 1],
    ]);

    lightColor = new Float32Array([
        // left
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],

        // platform 0
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // platform 2
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // platform 3
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // platform 4
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // platform 6
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // platform 5
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // platform 6
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // right
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],
        ...[.08, .065, .0, 1],

        // bg
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],
        ...[0, 0, 0, 1],

        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],
        ...[0, 0, 0, 1],

        ...[0, 0, 0, 1],
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],

        ...[0, 0, 0, 1],
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],
        ...[.92 / 2.3, .935 / 2.3, .95 / 2.3, 1],

        // fade
        ...[.0, .0, .0, 1],
        ...[.25, .25, .25, 1],
        ...[.25, .25, .25, 1],
        ...[.25, .25, .25, 1],
        ...[.0, .0, .0, 1],
        ...[.0, .0, .0, 1],

        // death
        ...(new Float32Array(48).fill(1)),
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
            let canToggleHitboxes = true,
                canToggleHitboxesTimer = 0;
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

                [...players]
                    .sort((_a, b) => Number(b.isDead))
                    .forEach((p) => p.render(dt));

                renderParticles(dt);

                renderLighting(this.lightGeometry, this.lightColor);

                composeDisplay();

                for (let i = 0; i < players.length; i++) {
                    players[i].renderUi(dt);
                }
            });

            const initialState = {
                playerStates: players.map((p) => p.saveState()),
                gameOver: false,
                gameOverTimer: 0,
                createdEndscreen: false,
            };
            type State = typeof initialState;
            const initialInput = [0, 0, 0, 0] as RawPlayerInput[]; // length of players
            type Input = typeof initialInput;

            const localControls = [
                new Controls({
                    left: { key: "s" },
                    up: { key: "e" },
                    down: { key: "d" },
                    right: { key: "f" },
                    attack: { key: "w" },
                    special: { key: "q" },
                }, playerNumbers[0]),
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
                        updateLoop.stop();
                        setGameNumber(gameNumber + 1);
                        resolve(new Map1());
                        return;
                    }

                    const data: {
                        tick: number;
                        inputs: RawPlayerInput[];
                        gameNumber: number;
                    } = JSON.parse(e.data);

                    if (data.gameNumber != gameNumber) return;

                    if (data.inputs) {
                        if (isHosting) {
                            otherConnections.forEach((c) =>
                                c.sendMessage(e.data)
                            );
                        }

                        if (data.tick > updateLoop.gameTick) {
                            updateLoop.catchupToTick(data.tick);
                        }

                        if (data.tick == updateLoop.gameTick) {
                            const orig = parkedInputs.get(data.tick);
                            if (orig) {
                                parkedInputs.set(data.tick, {
                                    ...orig,
                                    ...data.inputs,
                                });
                                return;
                            }
                            parkedInputs.set(data.tick, data.inputs);
                        }

                        let match = true;
                        for (const idx in data.inputs) {
                            const predicted =
                                    (updateLoop as UpdateLoop<State, Input>)
                                        .inputStates[
                                            data.tick - updateLoop.startTick
                                        ].inputs[idx],
                                orig = data.inputs[idx];
                            if (
                                predicted == (orig | PREDICTED)
                            ) {
                                (updateLoop as UpdateLoop<State, Input>)
                                    .inputStates[
                                        data.tick - updateLoop.startTick
                                    ].inputs[idx] = orig;
                                continue;
                            }
                            (updateLoop as UpdateLoop<State, Input>)
                                .inputStates[
                                    data.tick - updateLoop.startTick
                                ].inputs[idx] = orig;
                            match = false;
                        }
                        if (match) return;

                        rollbackTempHTML(data.tick);
                        // rollback the end screen if it is before the end screen was made
                        (updateLoop as UpdateLoop<State, Input>).rollback(
                            data.tick,
                            ({ state, inputs }) => {
                                return {
                                    state,
                                    inputs: inputs.map((i, idx) =>
                                        data.inputs[idx] != undefined
                                            ? data.inputs[idx]
                                            : i
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
                            inputs[i] |= PREDICTED;
                        }
                        for (const control of localControls) {
                            // @ts-ignore:
                            inputsToSend[control.playerNumber - 1] =
                                inputs[control.playerNumber - 1] =
                                    control.getInput();
                        }
                        const future = parkedInputs.get(updateLoop.gameTick);
                        if (future != undefined) {
                            for (const i in future) {
                                inputs[i] = future[i]!;
                            }
                            parkedInputs.delete(updateLoop.gameTick);
                        }
                        const tick = updateLoop.gameTick;
                        //setTimeout(() => {
                        for (const connection of connections) {
                            connection.sendMessage(
                                JSON.stringify({
                                    tick,
                                    inputs: inputsToSend,
                                    gameNumber,
                                }),
                            );
                        }
                        //}, Math.random() * 200);
                        return { state, inputs };
                    }
                    tick(
                        { state, inputs }: GameState<State, Input>,
                    ): GameState<State, Input> {
                        for (let i = 0; i < players.length; i++) {
                            players[i].restoreState(state.playerStates[i]);
                        }

                        if (isRollbacking) {
                            for (let i = 0; i < inputs.length; i++) {
                                inputs[i] |= PREDICTED;
                            }
                        }

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

                        if (canToggleHitboxesTimer < 0) {
                            canToggleHitboxes = true;
                        }
                        if (
                            canToggleHitboxes &&
                            isPressed("Escape")
                        ) {
                            canToggleHitboxes = false;
                            canToggleHitboxesTimer = .2;
                            toggleHitboxes();
                        }
                        canToggleHitboxesTimer -= DT;

                        if (state.gameOver && !state.createdEndscreen) {
                            state.gameOverTimer += DT;
                            if (state.gameOverTimer >= 2) {
                                stopListeningToInput();
                                removeEndScreen = createEndScreen(
                                    players.length,
                                    map.gamemode.getWinnerData(players),
                                    map.gamemode.getLeaderboardTable(players),
                                    () => {
                                        updateLoop.stop();
                                        setGameNumber(gameNumber + 1);
                                        resolve(new Map1());
                                        for (
                                            const connection of connections
                                        ) {
                                            connection.sendMessage(
                                                "restart",
                                            );
                                        }
                                    },
                                    () => {
                                        updateLoop.stop();
                                        setGameNumber(0);
                                        resolve(new JoinOrCreateLobby());
                                        for (const connection of connections) {
                                            connection.sendMessage("continue");
                                        }
                                        resetConnections();
                                    },
                                );
                                return saveState({
                                    ...state,
                                    createdEndscreen: true,
                                }, inputs);
                            }
                            return saveState(state, inputs);
                        }

                        return saveState({
                            ...state,
                            gameOver: map.gamemode.isGameOver(players),
                        }, inputs);
                    }
                    mergeStates(
                        incoming: GameState<State, Input>,
                        old: GameState<State, Input>,
                    ): GameState<State, Input> {
                        for (let i = 0; i < incoming.inputs.length; i++) {
                            if ((incoming.inputs[i] & PREDICTED) == 0) continue;

                            if ((old.inputs[i] & PREDICTED) == 0) {
                                incoming.inputs[i] = old.inputs[i];
                                continue;
                            }
                        }

                        for (
                            let i = 0;
                            i < incoming.state.playerStates.length;
                            i++
                        ) {
                            const data = JSON.parse(
                                    incoming.state.playerStates[i],
                                ) as ReturnType<Player["getState"]>,
                                oldData = JSON.parse(
                                    old.state.playerStates[i],
                                ) as ReturnType<Player["getState"]>;
                            data.lagX -= data.posX - oldData.posX;
                            data.lagY -= data.posY - oldData.posY;
                            incoming.state.playerStates[i] = JSON.stringify(
                                data,
                            );
                        }

                        return incoming;
                    }
                    onStop() {
                        for (
                            let i = 0;
                            i < players.length;
                            i++
                        ) {
                            players[i].onDestroy();
                        }
                        // @ts-ignore:
                        players = null;

                        stopRender();
                        removeEndScreen();
                    }
                })({ state: initialState, inputs: initialInput }),
            );
        });
    }
}
