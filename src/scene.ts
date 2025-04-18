import { Map1 } from "./map.ts";
import {
    clientName,
    Connection,
    connections,
    gameData,
    isHosting,
    lobbyName,
    setClientName,
    setGameData,
    setHost,
    setLobbyName,
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
                setHost(true);
                setLobbyName(lobbyName.value);
                resolve(new Lobby());
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
                setLobbyName(data.name);
                setHost(false);
                resolve(new Lobby());
            };
        });
    }
}

export class Lobby implements Scene {
    constructor(public isContinuing = false) {}

    run() {
        const playerManagers: PlayerManager[] = [];

        if (isHosting) {
            if (this.isContinuing) {
                for (const connection of connections) {
                    connection.sendMessage("continue");
                    connection.datachannel!.onmessage = (e) => {
                        const data = String(e.data);

                        if (data.startsWith("lobbydata")) {
                            const lobbyData: typeof gameData = JSON.parse(
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
                            const lobbyData: typeof gameData = {};
                            lobbyData["host"] = playerManagers[0].get();
                            for (let i = 0; i < connections.length; i++) {
                                const name = "client" + i,
                                    playerManager = playerManagers.filter((m) =>
                                        m.id == name
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
                }
            }

            const inviteUI = app.appendChild(
                document.createElement("div"),
            );
            inviteUI.id = "invite-ui";

            const lobbyUIContainer = app.appendChild(
                document.createElement("div"),
            );
            lobbyUIContainer.id = "lobby-ui-container-host";

            const cleanScene = () => {
                inviteUI.remove();
                lobbyUIContainer.remove();
            };

            const lobbyUI = lobbyUIContainer.appendChild(
                document.createElement("div"),
            );
            lobbyUI.id = "lobby-ui-host";

            const heading = lobbyUI.appendChild(document.createElement("h1"));
            heading.innerText = lobbyName;

            const lobbyPlayerManagerContainer = lobbyUI.appendChild(
                document.createElement("div"),
            );
            lobbyPlayerManagerContainer.id = "lobby-player-manager-container";

            const hostManager = new InteractivePlayerManager(
                "host",
                lobbyPlayerManagerContainer,
                () =>
                    connections.forEach((c) =>
                        c.sendMessage(
                            "lobbydata::" +
                                JSON.stringify({ "host": hostManager.get() }),
                        )
                    ),
            );
            playerManagers.push(hostManager);

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

            if (Object.keys(gameData).length > 0) {
                for (const name in gameData) {
                    const manager = playerManagers
                        .filter((m) => m.id == name);
                    if (manager.length == 0) {
                        playerManagers[
                            playerManagers.push(
                                new DisplayPlayerManager(
                                    name,
                                    lobbyPlayerManagerContainer,
                                ),
                            ) - 1
                        ].set(gameData[name]);
                        continue;
                    }
                    manager[0].set(gameData[name]);
                }
                setGameData({});
            }

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
                            name: lobbyName,
                            client: connection.name,
                        }));
                        connection.datachannel!.onmessage = (e) => {
                            const data = String(e.data);

                            if (data.startsWith("lobbydata")) {
                                const lobbyData: typeof gameData = JSON.parse(
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
                                const lobbyData: typeof gameData = {};
                                lobbyData["host"] = hostManager.get();
                                for (let i = 0; i < connections.length; i++) {
                                    const name = "client" + i,
                                        playerManager =
                                            playerManagers.filter((m) =>
                                                m.id == name
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
                    gameData["host"] = hostManager.get();
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
                        localPlayerDatas = hostManager.get();
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

        const cleanScene = () => {
            lobbyUIContainer.remove();
        };

        const lobbyUI = lobbyUIContainer.appendChild(
            document.createElement("div"),
        );
        lobbyUI.id = "lobby-ui";

        const heading = lobbyUI.appendChild(document.createElement("h1"));
        heading.innerText = lobbyName;

        const lobbyPlayerManagerContainer = lobbyUI.appendChild(
            document.createElement("div"),
        );
        lobbyPlayerManagerContainer.id = "lobby-player-manager-container";

        {
            const manager = new InteractivePlayerManager(
                clientName,
                lobbyPlayerManagerContainer,
                () => {
                    const data: typeof gameData = {};
                    data[clientName] = manager.get();
                    host.sendMessage(
                        "lobbydata::" + JSON.stringify(data),
                    );
                },
            );
            playerManagers.push(manager);
        }

        const settingsUI = lobbyUIContainer.appendChild(
            document.createElement("div"),
        );
        settingsUI.id = "settings-ui";

        return new Promise<Scene>((resolve) => {
            host.datachannel!.onmessage = (e) => {
                const data = String(e.data);

                if (data.startsWith("lobbydata")) {
                    const lobbyData: typeof gameData = JSON.parse(
                        data.split("::")[1],
                    );

                    for (const name in lobbyData) {
                        const manager = playerManagers
                            .filter((m) => m.id == name);
                        if (manager.length == 0) {
                            playerManagers[
                                playerManagers.push(
                                    new DisplayPlayerManager(
                                        name,
                                        lobbyPlayerManagerContainer,
                                    ),
                                ) - 1
                            ].set(lobbyData[name]);
                            continue;
                        }
                        manager[0].set(lobbyData[name]);
                    }
                }

                if (data.startsWith("start")) {
                    const receivedGameData: typeof gameData = JSON.parse(
                        data.split("::")[1],
                    );

                    const playerNumbers: PlayerNumber[] = [],
                        playerDatas: PlayerData[] = [];
                    let playerCount = 0;
                    for (const name in receivedGameData) {
                        if (name == clientName) {
                            for (
                                let i = 0;
                                i < receivedGameData[name].length;
                                i++
                            ) {
                                playerNumbers.push(
                                    ++playerCount as PlayerNumber,
                                );
                                playerDatas.push(receivedGameData[name][i]);
                            }
                            continue;
                        }
                        playerDatas.push(...receivedGameData[name]);
                        playerCount += receivedGameData[name].length;
                    }

                    cleanScene();
                    setPlayerNumbers(playerNumbers);
                    setPlayerDatas(playerDatas);
                    resolve(new Map1());
                    return;
                }
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

function rgbToHex(color: [r: number, g: number, b: number]): string {
    let r = Math.floor(color[0] * 255).toString(16),
        g = Math.floor(color[1] * 255).toString(16),
        b = Math.floor(color[2] * 255).toString(16);
    while (r.length < 2) r = "0" + r;
    while (g.length < 2) g = "0" + g;
    while (b.length < 2) b = "0" + b;
    return "#" + r + g + b;
}

function hexToRGB(hex: string): [r: number, g: number, b: number] {
    return [
        parseInt(hex.slice(1, 3), 16) / 255,
        parseInt(hex.slice(3, 5), 16) / 255,
        parseInt(hex.slice(5, 7), 16) / 255,
    ];
}

class InteractivePlayerData {
    container: HTMLDivElement;
    removeButton: HTMLButtonElement;
    nameInput: HTMLInputElement;
    classSelector: HTMLSelectElement;
    classSpecificElements: HTMLElement[] = [];

    data: PlayerData = {
        name: "",
        // @ts-ignore:
        classData: {},
    };

    constructor(
        public id: number,
        parent: HTMLElement,
        public onvalue: () => void,
        public onremove: () => void,
    ) {
        this.container = parent.appendChild(document.createElement("div"));
        this.container.id = "interactive-player-data";

        this.removeButton = this.container.appendChild(
            document.createElement("button"),
        );
        this.removeButton.id = "interactive-player-remove";
        this.removeButton.innerText = "X";
        this.removeButton.onclick = () => this.remove();

        this.nameInput = this.container.appendChild(
            document.createElement("input"),
        );
        this.nameInput.placeholder = "Unnamed #";
        this.nameInput.maxLength = 16;
        this.nameInput.onchange = () => {
            this.data.name = this.nameInput.value;
            this.onvalue();
        };

        this.classSelector = this.container.appendChild(
            document.createElement("select"),
        );

        {
            const option = this.classSelector.appendChild(
                document.createElement("option"),
            );
            option.value = "default" as PlayerData["classData"]["class"];
            option.innerText = "Default";
        }

        this.classSelector.selectedIndex = 0;
        (this.classSelector.onchange = () => {
            // @ts-ignore:
            this.data.classData = {
                class: this.classSelector
                    .value as PlayerData["classData"]["class"],
            };
            this.changeClass();
        })();
    }

    changeClass() {
        for (let i = 0; i < this.classSpecificElements.length; i++) {
            this.classSpecificElements[i].remove();
        }
        this.classSpecificElements = [];
        switch (this.data.classData.class) {
            case "default": {
                const subclassSelector = this.container.appendChild(
                    document.createElement("select"),
                );
                this.classSpecificElements.push(subclassSelector);

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value = "" as (typeof this.data.classData.subclass);
                    option.innerText = "(Base)";
                }

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value =
                        "precise" as (typeof this.data.classData.subclass);
                    option.innerText = "Precise";
                }

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value =
                        "persistant" as (typeof this.data.classData.subclass);
                    option.innerText = "Persistant";
                }

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value =
                        "poisonous" as (typeof this.data.classData.subclass);
                    option.innerText = "Poisonous";
                }

                if (this.data.classData.subclass) {
                    subclassSelector.value = this.data.classData.subclass;
                }
                (subclassSelector.onchange = () => {
                    this.data.classData.subclass = subclassSelector
                        .value as PlayerData["classData"]["subclass"];
                    this.onvalue();
                })();
                const colorPicker = this.container.appendChild(
                    document.createElement("input"),
                );
                this.classSpecificElements.push(colorPicker);
                colorPicker.type = "color";
                colorPicker.value = this.data.classData.color
                    ? rgbToHex(this.data.classData.color)
                    : [
                        "#FF334C",
                        "#007FFF",
                        "#33FF4C",
                        "#FFCC4C",
                        "#9933E5",
                        "#FF99FF",
                        "#1933CC",
                        "#FF9919",
                    ][Math.floor(Math.random() * 8)];
                (colorPicker.onchange = () => {
                    this.data.classData.color = hexToRGB(
                        colorPicker.value,
                    );
                    this.onvalue();
                })();
                break;
            }
        }
        this.onvalue();
    }

    set(data: PlayerData) {
        this.nameInput.value = data.name;
        this.data = data;
        this.classSelector.value = data.classData.class;
        this.changeClass();
    }

    get() {
        return this.data;
    }

    remove() {
        this.container.remove();
        this.onremove();
    }
}

class InteractivePlayerManager implements PlayerManager {
    container: HTMLDivElement;
    datas: InteractivePlayerData[] = [];

    constructor(
        public id: string,
        parent: HTMLElement,
        public onvalue: () => void,
    ) {
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
            this.addPlayer();
            this.onvalue();
        };
    }

    addPlayer() {
        const data = new InteractivePlayerData(
            this.datas.length,
            this.container,
            this.onvalue,
            () => {
                const newDatas: PlayerData[] = this.datas.filter((d) =>
                    d != data
                ).map((d) => d.get());
                this.set(newDatas);
            },
        );
        this.datas.push(data);
    }

    set(datas: PlayerData[]) {
        this.datas.map((d) => d.container.remove());
        this.datas = [];
        for (let i = 0; i < datas.length; i++) {
            const data = new InteractivePlayerData(
                this.datas.length,
                this.container,
                this.onvalue,
                () => {
                    const newDatas: PlayerData[] = this.datas.filter((d) =>
                        d != data
                    ).map((d) => d.get());
                    this.set(newDatas);
                },
            );
            data.set(datas[i]);
            this.datas.push(data);
        }
        this.onvalue();
    }

    get() {
        return this.datas.map((d) => d.get());
    }
}

class DisplayPlayerData {
    container: HTMLDivElement;
    nameInput: HTMLInputElement;
    classSelector: HTMLSelectElement;
    classSpecificElements: HTMLElement[] = [];

    constructor(
        parent: HTMLElement,
        public data: PlayerData,
    ) {
        this.container = parent.appendChild(document.createElement("div"));
        this.container.id = "display-player-data";

        this.nameInput = this.container.appendChild(
            document.createElement("input"),
        );
        this.nameInput.placeholder = "Unnamed #";
        this.nameInput.maxLength = 16;
        this.nameInput.value = data.name;
        this.nameInput.disabled = true;

        this.classSelector = this.container.appendChild(
            document.createElement("select"),
        );

        {
            const option = this.classSelector.appendChild(
                document.createElement("option"),
            );
            option.value = data.classData.class;
            option.innerText = data.classData.class[0].toUpperCase() +
                data.classData.class.slice(1);
        }

        this.classSelector.disabled = true;

        switch (data.classData.class) {
            case "default": {
                const subclassSelector = this.container.appendChild(
                    document.createElement("select"),
                );
                this.classSpecificElements.push(subclassSelector);

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value = "" as (typeof this.data.classData.subclass);
                    option.innerText = "(Base)";
                }

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value =
                        "precise" as (typeof this.data.classData.subclass);
                    option.innerText = "Precise";
                }

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value =
                        "persistant" as (typeof this.data.classData.subclass);
                    option.innerText = "Persistant";
                }

                {
                    const option = subclassSelector.appendChild(
                        document.createElement("option"),
                    );
                    option.value =
                        "poisonous" as (typeof this.data.classData.subclass);
                    option.innerText = "Poisonous";
                }

                subclassSelector.value = this.data.classData.subclass;
                subclassSelector.disabled = true;

                const colorPicker = this.container.appendChild(
                    document.createElement("input"),
                );
                this.classSpecificElements.push(colorPicker);
                colorPicker.type = "color";
                colorPicker.value = rgbToHex(this.data.classData.color);
                colorPicker.disabled = true;
                break;
            }
        }
    }
}

class DisplayPlayerManager implements PlayerManager {
    container: HTMLDivElement;
    displays: DisplayPlayerData[] = [];
    datas: PlayerData[] = [];

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
        this.displays.map((d) => d.container.remove());
        this.displays = [];
        for (const data of datas) {
            this.displays.push(new DisplayPlayerData(this.container, data));
        }
    }

    get() {
        return this.datas;
    }
}
