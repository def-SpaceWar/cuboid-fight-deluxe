import { Map1 } from "./map.ts";
import {
    clientName,
    Connection,
    connections,
    isHosting,
    setClientName,
    setHost,
    setPlayerDatas,
    setPlayerNumbers,
} from "./networking.ts";
import { PlayerData, PlayerNumber } from "./player.ts";
import { clearScreen } from "./render.ts";

const app = document.getElementById("app")!;

export interface Scene {
    run(): Promise<Scene>;
}

export class JoinOrCreateLobby implements Scene {
    run() {
        clearScreen();

        const lobbyInvite = app.appendChild(document.createElement("input"));
        lobbyInvite.placeholder = "Lobby Invite";

        const joinLobbyBtn = app.appendChild(
            document.createElement("button"),
        );
        joinLobbyBtn.id = "join-lobby";
        joinLobbyBtn.innerText = "Join Lobby";

        const spacer = app.appendChild(document.createElement("div"));
        spacer.id = "spacer";

        const lobbyName = app.appendChild(document.createElement("input"));
        lobbyName.placeholder = "Lobby Name";
        lobbyName.maxLength = 16;

        const createLobbyBtn = app.appendChild(
            document.createElement("button"),
        );
        createLobbyBtn.id = "create-lobby";
        createLobbyBtn.innerText = "Create Lobby";

        const cleanScene = () => {
            lobbyInvite.remove();
            joinLobbyBtn.remove();
            spacer.remove();
            lobbyName.remove();
            createLobbyBtn.remove();
        };

        return new Promise<Scene>((resolve) => {
            joinLobbyBtn.onclick = () => {
                cleanScene();
                resolve(new AnswerLobby(lobbyInvite.value));
            };

            createLobbyBtn.onclick = () => {
                cleanScene();
                resolve(new Lobby(true, lobbyName.value));
            };
        });
    }
}

class AnswerLobby implements Scene {
    constructor(public offer: string) {}

    async run() {
        const loadingAnswer = app.appendChild(
            document.createElement("textarea"),
        );
        loadingAnswer.id = "lobby-answer-data";
        loadingAnswer.placeholder = "Loading...";
        loadingAnswer.disabled = true;

        const connection = new Connection("host");
        const copyAnswer = app.appendChild(document.createElement("p"));
        const cleanScene = () => {
            loadingAnswer.remove();
            copyAnswer.remove();
        };

        try {
            const answer = await connection.answer(this.offer);
            loadingAnswer.value = answer;
            navigator.clipboard.writeText(answer);
            copyAnswer.innerText = "Copy and send to lobby host! (auto-copied)";
            await connection.connect();
            connections.push(connection);
            await connection.acquiredDataChannel!;
        } catch (e) {
            alert(e);
            if (e == "failed") {
                cleanScene();
                return new JoinOrCreateLobby();
            }
        }

        return new Promise<Scene>((resolve) => {
            connection.datachannel!.onmessage = (e) => {
                cleanScene();
                const data = JSON.parse(e.data);
                setClientName(data.client);
                resolve(new Lobby(false, data.name));
            };
        });
    }
}

export class Lobby implements Scene {
    constructor(isHost: boolean, public name: string) {
        setHost(isHost);
    }

    run() {
        const playerManagers: PlayerManager[] = [];
        if (isHosting) {
            const inviteUI = app.appendChild(
                document.createElement("div"),
            );
            inviteUI.id = "invite-ui";

            const lobbyUIContainer = app.appendChild(
                document.createElement("div"),
            );
            lobbyUIContainer.id = "lobby-ui-container-host";

            const lobbyUI = lobbyUIContainer.appendChild(
                document.createElement("div"),
            );
            lobbyUI.id = "lobby-ui-host";

            const heading = lobbyUI.appendChild(document.createElement("h1"));
            heading.innerText = this.name;

            const lobbyPlayerManagerContainer = lobbyUI.appendChild(
                document.createElement("div"),
            );
            lobbyPlayerManagerContainer.id = "lobby-player-manager-container";

            playerManagers.push(
                new InteractivePlayerManager(
                    "host",
                    lobbyPlayerManagerContainer,
                ),
            );

            const loadingInvite = inviteUI.appendChild(
                document.createElement("textarea"),
            );
            loadingInvite.id = "lobby-answer-data";
            loadingInvite.placeholder = "Loading...";
            loadingInvite.disabled = true;

            const copyOffer = inviteUI.appendChild(document.createElement("p"));
            copyOffer.innerText =
                "Copy and send to friend! (auto-copied)\nThen have your friend send you their answer!";

            const acceptAnswer = inviteUI.appendChild(
                document.createElement("input"),
            );
            acceptAnswer.placeholder = "Paste in answer...";

            const joinLobbyBtn = inviteUI.appendChild(
                document.createElement("button"),
            );
            joinLobbyBtn.id = "accept-lobby";
            joinLobbyBtn.innerText = "Accept Answer";

            const getConnection = async () => {
                const connection = new Connection(
                    "client" + connections.length,
                );
                const offer = await connection.offer();
                loadingInvite.value = offer;
                navigator.clipboard.writeText(offer);
                joinLobbyBtn.onclick = async () => {
                    try {
                        connection.acceptAnswer(acceptAnswer.value);
                        await connection.connect();
                        await connection.dataOpen();
                        connection.sendMessage(JSON.stringify({
                            name: this.name,
                            client: connection.name,
                        }));
                        connection.datachannel!.onmessage = (e) => {
                            const data = String(e.data);

                            if (data.startsWith("lobbydata")) {
                                const lobbyData: {
                                    [k: string]: PlayerData[];
                                } = JSON.parse(
                                    data.split("::")[1],
                                );

                                for (const name in lobbyData) {
                                    playerManagers
                                        .filter((m) => m.id == name)[0]
                                        .set(lobbyData[name]);
                                }

                                for (const c of connections) {
                                    if (c == connection) continue;
                                    c.sendMessage(e.data);
                                }
                                return;
                            }

                            if (data.startsWith("getlobbydata")) {
                                const lobbyData: {
                                    // TODO: gamemode: GameModeData;
                                    [k: string]: PlayerData[];
                                } = {};
                                lobbyData["host"] = playerManagers[0].get();
                                for (let i = 0; i < connections.length; i++) {
                                    const name = "client" + i,
                                        playerManager =
                                            playerManagers.filter((p) =>
                                                p.id == name
                                            )[0];
                                    lobbyData["client" + i] = playerManager
                                        .get();
                                }
                                connections.map((c) =>
                                    c.sendMessage(
                                        "lobbydata::" +
                                            JSON.stringify(lobbyData),
                                    )
                                );
                                return;
                            }
                        };

                        connections.push(connection);
                        acceptAnswer.value = "";
                        playerManagers.push(
                            new DisplayPlayerManager(
                                connection.name,
                                lobbyPlayerManagerContainer,
                            ),
                        );

                        getConnection();
                    } catch (e) {
                        alert(e);
                        if (e == "failed") {
                            loadingInvite.value = "";
                            acceptAnswer.value = "";
                            getConnection();
                        }
                    }
                };
            };
            getConnection();

            const cleanScene = () => {
                inviteUI.remove();
                lobbyUIContainer.remove();
            };

            const settingsUI = lobbyUIContainer.appendChild(
                document.createElement("div"),
            );
            settingsUI.id = "settings-ui-host";

            const startGame = settingsUI.appendChild(
                document.createElement("button"),
            );
            startGame.id = "create-lobby";
            startGame.innerText = "Start Game";

            return new Promise<Scene>((resolve) => {
                startGame.onclick = () => {
                    const gameData: {
                        // TODO: gamemode: GameModeData;
                        [k: string]: PlayerData[];
                    } = {};
                    gameData["host"] = playerManagers[0].get();
                    for (let i = 0; i < connections.length; i++) {
                        const name = "client" + i,
                            playerManager = playerManagers.filter((p) =>
                                p.id == name
                            )[0];
                        gameData["client" + i] = playerManager.get();
                    }
                    connections.map((c) =>
                        c.sendMessage(
                            "start::" + JSON.stringify(gameData),
                        )
                    );

                    const playerNumbers: PlayerNumber[] = [],
                        localPlayerDatas = playerManagers[0].get();
                    for (let i = 0; i < localPlayerDatas.length; i++) {
                        playerNumbers.push(i + 1 as PlayerNumber);
                    }

                    cleanScene();
                    setPlayerNumbers(playerNumbers);
                    setPlayerDatas(playerManagers.flatMap((m) => m.get()));
                    resolve(new Map1());
                };
            });
        }

        const host = connections[0];
        host.sendMessage("getlobbydata");

        const lobbyUIContainer = app.appendChild(document.createElement("div"));
        lobbyUIContainer.id = "lobby-ui-container";

        const lobbyUI = lobbyUIContainer.appendChild(
            document.createElement("div"),
        );
        lobbyUI.id = "lobby-ui";

        const heading = lobbyUI.appendChild(document.createElement("h1"));
        heading.innerText = this.name;

        const lobbyPlayerManagerContainer = lobbyUI.appendChild(
            document.createElement("div"),
        );
        lobbyPlayerManagerContainer.id = "lobby-player-manager-container";

        playerManagers.push(
            new InteractivePlayerManager(
                clientName,
                lobbyPlayerManagerContainer,
            ),
        );

        const cleanScene = () => {
            lobbyUIContainer.remove();
        };

        const settingsUI = lobbyUIContainer.appendChild(
            document.createElement("div"),
        );
        settingsUI.id = "settings-ui";

        return new Promise<Scene>((resolve) => {
            host.datachannel!.onmessage = (e) => {
                const data = String(e.data);

                if (data.startsWith("lobbydata")) {
                    const lobbyData: {
                        [k: string]: PlayerData[];
                    } = JSON.parse(
                        data.split("::")[1],
                    );

                    for (const name in lobbyData) {
                        const manager = playerManagers
                            .filter((m) => m.id == name);
                        if (manager.length == 0) {
                            playerManagers.push(
                                new DisplayPlayerManager(
                                    name,
                                    lobbyPlayerManagerContainer,
                                ),
                            );
                            continue;
                        }
                        manager[0].set(lobbyData[name]);
                    }
                }

                if (data.startsWith("start")) {
                    const gameData: {
                        [k: string]: PlayerData[];
                    } = JSON.parse(data.split("::")[1]);

                    const playerNumbers: PlayerNumber[] = [],
                        playerDatas: PlayerData[] = [];
                    let playerCount = 0;
                    for (const name in gameData) {
                        if (name == clientName) {
                            for (let i = 0; i < gameData[name].length; i++) {
                                playerNumbers.push(
                                    ++playerCount as PlayerNumber,
                                );
                                playerDatas.push(gameData[name][i]);
                            }
                            continue;
                        }
                        playerDatas.push(...gameData[name]);
                        playerCount += gameData[name].length;
                    }

                    cleanScene();
                    setPlayerNumbers(playerNumbers);
                    setPlayerDatas(playerDatas);
                    resolve(new Map1());
                    return;
                }

                //if (data.startsWith("lobbyData")) {
                //}
            };
        });
    }
}

// create elems and whatever
interface PlayerManager {
    id: string;
    set(datas: PlayerData[]): void;
    get(): PlayerData[];
}

class InteractivePlayerManager implements PlayerManager {
    container: HTMLDivElement;
    datas: PlayerData[] = [
        {
            name: "hehehe HAost",
            classData: {
                class: "default",
                color: [1, .2, .3],
            },
        },
        //{
        //    name: "hehehe HA 2",
        //    classData: {
        //        class: "default",
        //        color: [0, 1, 1],
        //    },
        //},
    ];

    constructor(public id: string, parent: HTMLElement) {
        this.container = parent.appendChild(document.createElement("div"));
        this.container.id = "lobby-interactive-player-manager";
        const containerTitle = this.container.appendChild(
            document.createElement("h2"),
        );
        containerTitle.innerText = id + " (you)";

        const newPlayerBtn = containerTitle.appendChild(
            document.createElement("button"),
        );
        newPlayerBtn.innerText = "+";

        newPlayerBtn.onclick = () => {
            //console.log("new player!");
        };
    }

    addPlayer() {
        //
    }

    // on data change or smth like that

    set(datas: PlayerData[]) {
        // update visuals too
        this.datas = datas;
    }

    get() {
        return this.datas;
    }
}

class DisplayPlayerManager implements PlayerManager {
    container: HTMLDivElement;
    datas: PlayerData[] = [
        {
            name: "hehehe HA " + Math.random().toFixed(3),
            classData: {
                class: "default",
                color: [Math.random(), Math.random(), Math.random()],
            },
        },
        //{
        //    name: "hehehe HA " + Math.random(),
        //    classData: {
        //        class: "default",
        //        color: [Math.random(), 1, Math.random()],
        //    },
        //},
    ];

    constructor(public id: string, parent: HTMLElement) {
        this.container = parent.appendChild(document.createElement("div"));
        this.container.id = "lobby-display-player-manager";
        const containerTitle = this.container.appendChild(
            document.createElement("h2"),
        );
        containerTitle.innerText = id;
    }

    set(datas: PlayerData[]) {
        this.datas = datas;
    }

    get() {
        return this.datas;
    }
}
