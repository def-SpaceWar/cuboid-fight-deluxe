import { Connection, connections, isHosting, setHost } from "./networking.ts";
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

        const connection = new Connection();
        const answer = await connection.answer(this.offer);
        loadingAnswer.value = answer;
        navigator.clipboard.writeText(answer);

        const copyAnswer = app.appendChild(document.createElement("p"));
        copyAnswer.innerText = "Copy and send to lobby host! (auto-copied)";
        await connection.connect();
        connections.push(connection);
        console.log(connection.pc.remoteDescription!.sdp.split(" ")[1]);
        await connection.acquiredDataChannel!;

        const cleanScene = () => {
            loadingAnswer.remove();
            copyAnswer.remove();
        };

        return new Promise<Scene>((resolve) => {
            connection.datachannel!.onmessage = (e) => {
                cleanScene();
                resolve(new Lobby(false, e.data));
            };
        });
    }
}

export class Lobby implements Scene {
    constructor(isHost: boolean, public name: string) {
        setHost(isHost);
        console.log(this.name);
    }

    async run() {
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

            const connection = new Connection();
            const offer = await connection.offer();
            loadingInvite.value = offer;
            navigator.clipboard.writeText(offer);

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
            joinLobbyBtn.onclick = () => {
                connection.acceptAnswer(acceptAnswer.value);
            };
            await connection.connect();
            await connection.dataOpen();
            connection.sendMessage(this.name);
            console.log(connection.pc.remoteDescription!.sdp.split(" ")[1]);

            const cleanScene = () => {
                inviteUI.remove();
                lobbyUI.remove();
            };

            return new Promise<Scene>((resolve) => {
            });
        }

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
        });
    }
}
