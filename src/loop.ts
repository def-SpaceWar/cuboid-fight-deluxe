import { FPS_SAMPLE_AMOUNT, TPS_SAMPLE_AMOUNT, MIN_DT } from "./flags";
const app = document.getElementById("app")!;

export function renderLoop(c: () => unknown): () => void;
export function renderLoop(c: (dt: number) => unknown): () => void;
export function renderLoop(c: Function) {
    const fpsList = new Float32Array(FPS_SAMPLE_AMOUNT),
        avgFps = () => {
            let sum = 0;
            for (let i = 0; i < FPS_SAMPLE_AMOUNT; i++) sum += fpsList[i];
            return sum / FPS_SAMPLE_AMOUNT;
        },
        fpsText = app.appendChild(document.createElement("p"));
    fpsText.id = "fps";

    let before = performance.now(),
        fpsIdx = 0,
        handle = requestAnimationFrame(loop);
    function loop(now: DOMHighResTimeStamp) {
        const dt = (now - before) / 1_000;
        before = now;

        fpsList[fpsIdx] = 1 / dt;
        fpsIdx < FPS_SAMPLE_AMOUNT ? fpsIdx++ : fpsIdx = 0;
        fpsText.innerText = "FPS: " + avgFps().toPrecision(3);

        handle = requestAnimationFrame(loop);
        c(Math.min(dt, MIN_DT));
    }
    return () => cancelAnimationFrame(handle);
}

export function updateLoop(c: () => unknown): () => void;
export function updateLoop(c: (dt: number) => unknown): () => void;
export function updateLoop(c: Function) {
    const tpsList = new Float32Array(TPS_SAMPLE_AMOUNT),
        avgTps = () => {
            let sum = 0;
            for (let i = 0; i < TPS_SAMPLE_AMOUNT; i++) sum += tpsList[i];
            return sum / TPS_SAMPLE_AMOUNT;
        },
        tpsText = app.appendChild(document.createElement("p"));
    tpsText.id = "tps";

    let before = performance.now(),
        tpsIdx = 0;
    const handle = setInterval(() => {
        const now = performance.now(),
            dt = (now - before) / 1_000;
        before = now;

        tpsList[tpsIdx] = 1 / dt;
        tpsIdx < FPS_SAMPLE_AMOUNT ? tpsIdx++ : tpsIdx = 0;
        tpsText.innerText = "TPS: " + avgTps().toPrecision(3);

        const dtPrime = Math.min(dt, MIN_DT);
        c(dtPrime);
        tickTimers(dtPrime);
    });
    return () => clearInterval(handle);
}

export type Timer = [c: Function, t: number];
const timers: Timer[] = [];

function tickTimers(dt: number) {
    for (let i = 0; i < timers.length; i++) {
        const timer = timers[i];
        timer[1] -= dt;
        if (timer[1] > 0) continue;
        timer[0]();
        timers.splice(i, 1);
        i--;
    }
}

export function timeout(c: Function, t: number) {
    const timer: Timer = [c, t];
    timers.push(timer)
    return timer;
}

export function clearTimer(t: Timer) {
    for (let i = 0; i < timers.length; i++) {
        if (timers[i] != t) continue;
        timers.splice(i, 1);
        return;
    }
}
