import {
    FPS_SAMPLE_AMOUNT,
    MAX_SAVED_TICKS,
    MIN_DT,
    TPS,
    TPS_SAMPLE_AMOUNT,
} from "./flags.ts";
const app = document.getElementById("app")!;

export function renderLoop(c: () => unknown): () => void;
export function renderLoop(c: (dt: number) => unknown): () => void;
export function renderLoop(c: (dt: number) => unknown) {
    const fpsList = new Float32Array(FPS_SAMPLE_AMOUNT),
        avgFps = () => {
            let sum = 0;
            for (let i = 0; i < FPS_SAMPLE_AMOUNT; i++) sum += fpsList[i];
            return sum / FPS_SAMPLE_AMOUNT;
        },
        fpsText = app.appendChild(document.createElement("p")),
        fpsTextNode = document.createTextNode("");
    fpsText.id = "fps";
    fpsText.innerText = "FPS: ";
    fpsText.appendChild(fpsTextNode);

    let before = performance.now(),
        fpsIdx = 0,
        handle = requestAnimationFrame(loop);
    function loop(now: DOMHighResTimeStamp) {
        const dt = (now - before) / 1_000;
        before = now;

        fpsList[fpsIdx] = 1 / dt;
        fpsIdx < FPS_SAMPLE_AMOUNT ? fpsIdx++ : fpsIdx = 0;
        fpsTextNode.textContent = avgFps().toPrecision(3);

        handle = requestAnimationFrame(loop);
        c(Math.min(dt, MIN_DT));
    }
    return () => {
        fpsTextNode.remove();
        fpsText.remove();
        cancelAnimationFrame(handle);
    };
}

export type GameState<T, I> = {
    state: T;
    inputs: I;
};

export let isRollbacking = false;
export let toTick = 0;
export abstract class UpdateLoop<T, I> {
    tpsList: Float32Array;
    avgTps: () => number;
    tpsText: HTMLParagraphElement;
    tpsTextNode: Text;

    handle: number;
    startTick = 0;
    gameTick = 0;
    inputStates: GameState<T, I>[] = [];

    constructor(public state: GameState<T, I>) {
        this.tpsList = new Float32Array(TPS_SAMPLE_AMOUNT),
            this.avgTps = () => {
                let sum = 0;
                for (let i = 0; i < TPS_SAMPLE_AMOUNT; i++) {
                    sum += this.tpsList[i];
                }
                return sum / TPS_SAMPLE_AMOUNT;
            },
            this.tpsText = app.appendChild(document.createElement("p")),
            this.tpsTextNode = document.createTextNode("");
        this.tpsText.id = "tps";
        this.tpsText.innerText = "TPS: ";
        this.tpsText.appendChild(this.tpsTextNode);

        let before = performance.now(),
            tpsIdx = 0;
        this.handle = setInterval(() => {
            const now = performance.now(),
                dt = (now - before) / 1_000;
            before = now;

            const dtPrime = Math.min(dt, MIN_DT);
            this.tpsList[tpsIdx] = 1 / dtPrime;
            tpsIdx < FPS_SAMPLE_AMOUNT ? tpsIdx++ : tpsIdx = 0;
            this.tpsTextNode.textContent = this.avgTps().toPrecision(3);

            this.inputStates.push(this.getInput(this.state));
            if (this.inputStates.length > MAX_SAVED_TICKS) {
                this.startTick++;
                this.inputStates.shift();
            }
            this.state = this.tick(
                structuredClone(
                    this.inputStates[this.gameTick - this.startTick],
                ),
            );
            this.gameTick++;
        }, 1_000 / TPS);
    }

    catchupToTick(tick: number) {
        while (this.gameTick < tick) {
            this.inputStates.push(this.getInput(this.state));
            if (this.inputStates.length > MAX_SAVED_TICKS) {
                this.startTick++;
                this.inputStates.shift();
            }
            this.state = this.tick(
                structuredClone(
                    this.inputStates[this.gameTick - this.startTick],
                ),
            );
            this.gameTick++;
        }
    }

    abstract getInput(initial: GameState<T, I>): GameState<T, I>;
    abstract tick(initial: GameState<T, I>): GameState<T, I>;

    /**
     * use new inputs whereever possible basically,
     * on internet-based control objects, put whether or not
     * it was obtained from the internet or predicted.
     * prefer the non-predicted values over the predicted values, otherwise
     * use the newer values than the older predicted values */
    abstract mergeStates(
        incoming: GameState<T, I>,
        old: GameState<T, I>,
    ): GameState<T, I>;

    rollback(
        _toTick: number,
        updateInput: (orig: GameState<T, I>) => GameState<T, I>,
    ) {
        isRollbacking = true;
        toTick = _toTick;
        this.state = updateInput(this.inputStates[toTick - this.startTick]);
        const previousTick = this.gameTick;
        this.gameTick = toTick;
        while (this.gameTick < previousTick) {
            this.inputStates[this.gameTick - this.startTick] = this.mergeStates(
                this.state,
                this.inputStates[this.gameTick - this.startTick],
            );
            this.state = this.tick(structuredClone(this.state));
            this.gameTick++;
        }
        isRollbacking = false;
    }

    abstract onStop(): void;

    stop() {
        this.onStop();
        this.tpsTextNode.remove();
        this.tpsText.remove();
        clearInterval(this.handle);
        // @ts-ignore:
        setUpdateLoop(null);
    }
}

export let updateLoop: UpdateLoop<unknown, unknown>;
export function setUpdateLoop<T, I>(loop: UpdateLoop<T, I>) {
    updateLoop = loop as UpdateLoop<unknown, unknown>;
}
