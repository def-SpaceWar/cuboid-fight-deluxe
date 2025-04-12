import { PlayerData, PlayerNumber } from "./player.ts";

export let isHosting = true;
export const setHost = (val: boolean) => isHosting = val;

export let gameNumber = 0;
export const setGameNumber = (val: number) => gameNumber = val;

/**
 * if isHosting, connections represents the other players
 * if not isHosting, connections[0] is the host
 */
export let connections = [] as Connection[];
export function resetConnections() {
    connections = [];
}

export class Connection {
    pc: RTCPeerConnection;
    datachannel?: RTCDataChannel;
    id?: string;

    constructor() {
        this.pc = new RTCPeerConnection(
            import.meta.env.DEV
                ? {
                    "iceServers": [{ "urls": "stun:stun.gmx.net" }],
                    //"iceServers": [{
                    //    "urls": [
                    //        "stun:stun1.l.google.com:19302",
                    //        "stun:stun2.l.google.com:19302",
                    //    ],
                    //}],
                }
                : {
                    iceServers: [
                        { "urls": "stun:stun.relay.metered.ca:80" },
                        {
                            "urls": "turn:global.relay.metered.ca:80",
                            "username": "36c84ec55e36a8f40e69e86a",
                            "credential": "jG6bGW1qKk0N+lU1",
                        },
                        {
                            "urls":
                                "turn:global.relay.metered.ca:80?transport=tcp",
                            "username": "36c84ec55e36a8f40e69e86a",
                            "credential": "jG6bGW1qKk0N+lU1",
                        },
                        {
                            "urls": "turn:global.relay.metered.ca:443",
                            "username": "36c84ec55e36a8f40e69e86a",
                            "credential": "jG6bGW1qKk0N+lU1",
                        },
                        {
                            "urls":
                                "turns:global.relay.metered.ca:443?transport=tcp",
                            "username": "36c84ec55e36a8f40e69e86a",
                            "credential": "jG6bGW1qKk0N+lU1",
                        },
                    ],
                },
        ); //, { "optional": [{ "DtlsSrtpKeyAgreement": true }] });
    }

    async offer() {
        this.datachannel = this.pc.createDataChannel("test", {});
        this.datachannel.onopen = (_) => {};
        this.datachannel.onmessage = (e) => {
            console.log(e.data);
        };

        const offer = await this.pc.createOffer();
        this.pc.setLocalDescription(offer);
        return await new Promise<string>((resolve) => {
            this.pc.onicecandidate = (e) => {
                if (e.candidate == null) {
                    resolve(JSON.stringify(this.pc.localDescription));
                }
            };
        });
    }

    acquiredDataChannel?: Promise<void>;
    async answer(offer: string) {
        const offerDesc = new RTCSessionDescription(JSON.parse(offer));
        this.pc.setRemoteDescription(offerDesc);
        const answer = await this.pc.createAnswer();
        this.pc.setLocalDescription(answer);
        this.acquiredDataChannel = new Promise<void>((resolve) => {
            this.pc.ondatachannel = (e) => {
                this.datachannel = e.channel;
                this.datachannel.onopen = (_) => {};
                this.datachannel.onmessage = (e) => {
                    console.log(e.data);
                };
                resolve();
            };
        });

        return await new Promise<string>((resolve) => {
            this.pc.onicecandidate = (e) => {
                if (e.candidate == null) {
                    resolve(JSON.stringify(this.pc.localDescription));
                }
            };
        });
    }

    acceptAnswer(answer: string) {
        const answerDesc = new RTCSessionDescription(JSON.parse(answer));
        this.pc.setRemoteDescription(answerDesc);
    }

    connect() {
        return new Promise<void>((resolve, reject) => {
            this.pc.onconnectionstatechange = (_) => {
                console.log(this.pc.connectionState);
                if (this.pc.connectionState == "connecting") return;
                if (this.pc.connectionState == "connected") {
                    this.id = this.pc.remoteDescription!.sdp.split(" ")[1];
                    console.log(this.id);
                    resolve();
                }
                reject(this.pc.connectionState);
            };
        });
    }

    dataOpen() {
        return new Promise<void>((resolve) => {
            this.datachannel!.addEventListener("open", (_) => {
                resolve();
            });
        });
    }

    sendMessage(data: string) {
        this.datachannel!.send(data);
    }
}

export let playerDatas: PlayerData[] = [
    {
        name: "Mafia",
        color: [1, .2, .3],
    },
    {
        name: "Innocent",
        color: [0, .5, 1],
    },
    {
        name: "Villager",
        color: [.2, 1, .3],
    },
    {
        name: "Mayor",
        color: [1, .8, .3],
    },
];
export function setPlayerDatas(data: PlayerData[]) {
    playerDatas = data;
}

export let playerNumbers: PlayerNumber[] = [];
export function setPlayerNumbers(numbers: PlayerNumber[]) {
    playerNumbers = numbers;
}
