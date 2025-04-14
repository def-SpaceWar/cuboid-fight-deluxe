import { Map1 } from "./map.ts";
import {
    Connection,
    connections,
    isHosting,
    setClientName,
    setHost,
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
        if (isHosting) {
            const inviteUI = app.appendChild(
                document.createElement("div"),
            );
            inviteUI.id = "invite-ui";

            const lobbyUI = app.appendChild(
                document.createElement("div"),
            );
            lobbyUI.id = "lobby-ui-host";

            const heading = lobbyUI.appendChild(document.createElement("h1"));
            heading.innerText = this.name;

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
                            const data = JSON.parse(e.data);

                            if (data.startsWith("lobbydata")) {
                                const playerInfos = JSON.parse(
                                    data.split(":")[1],
                                );

                                for (const name in playerInfos) {
                                    console.log(name);
                                }

                                for (const c of connections) {
                                    if (c == connection) continue;
                                    c.sendMessage(e.data);
                                }
                            }
                        };

                        connections.push(connection);
                        acceptAnswer.value = "";

                        getConnection();
                    } catch (e) {
                        alert(e);
                        if (e == "failed") {
                            acceptAnswer.value = "";
                            getConnection();
                        }
                    }
                };
            };
            getConnection();

            const cleanScene = () => {
                inviteUI.remove();
                lobbyUI.remove();
            };

            const startGame = lobbyUI.appendChild(
                document.createElement("button"),
            );
            startGame.id = "create-lobby";
            startGame.innerText = "Start Game";

            return new Promise<Scene>((resolve) => {
                startGame.onclick = () => {
                    for (let i = 0; i < connections.length; i++) {
                        connections[i].sendMessage("start:" + (i + 2));
                    }
                    cleanScene();
                    setPlayerNumbers([1]);
                    resolve(new Map1());
                };
            });
        }

        const host = connections[0];
        host.sendMessage("getlobbydata");

        const lobbyUI = app.appendChild(
            document.createElement("div"),
        );
        lobbyUI.id = "lobby-ui";

        const heading = lobbyUI.appendChild(document.createElement("h1"));
        heading.innerText = this.name;

        // not host code
        const cleanScene = () => {
            lobbyUI.remove();
        };

        return new Promise<Scene>((resolve) => {
            host.datachannel!.onmessage = (e) => {
                const data = String(e.data);
                if (data.startsWith("start")) {
                    setPlayerNumbers(
                        data.split(":")[1]
                            .split(",")
                            .map((s) => Number(s) as PlayerNumber),
                    ); // change this to PlayerData[] and PlayerNumber[]
                    cleanScene();
                    resolve(new Map1());
                    return;
                }

                if (data.startsWith("lobbydata")) {
                    const playerInfos = JSON.parse(data.split(":")[1]);
                    for (const name in playerInfos) {
                        console.log(name);
                    }
                    // "host": PlayerData[]
                    // "client0": PlayerData[]
                    // "client1": PlayerData[]
                    // "client2": PlayerData[]
                    // render all of them
                }
            };
        });
    }
}

// create elems and whatever
interface PlayerManager {
    id: string;
    set(datas: PlayerData[]): void;
    set(): PlayerData[];
}

class InteractivePlayerManager implements PlayerManager {
    constructor(public id: string, parent: HTMLElement) {
        // make all elements
    }

    set(datas: PlayerData[]) {}

    get() {
        return [];
    }
}

class DisplayPlayerManager implements PlayerManager {
    constructor(public id: string, parent: HTMLElement) {
        // make all elements
        // do on click functionality
        // on value change functionality
        // yada yada yada
    }

    set(datas: PlayerData[]) {}

    get() {
        return [];
    }
}
