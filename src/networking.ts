export let isHosting = false;
export const setHost = (val: boolean) => isHosting = val;

/**
 * if isHosting, connections represents the other players
 * if not isHosting, connections[0] is the host
 */
export const connections = [] as Connection[];

export class Connection {
    pc: RTCPeerConnection;
    datachannel?: RTCDataChannel;

    constructor() {
        this.pc = new RTCPeerConnection({
            "iceServers": [{ "urls": "stun:stun.gmx.net" }],
        }); //, { "optional": [{ "DtlsSrtpKeyAgreement": true }] });
    }

    async offer() {
        this.datachannel = this.pc.createDataChannel("test", { ordered: true });
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
                if (this.pc.connectionState == "connected") resolve();
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
