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
    }
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
        tpsText = app.appendChild(document.createElement("p")),
        tpsTextNode = document.createTextNode("");
    tpsText.id = "tps";
    tpsText.innerText = "TPS: ";
    tpsText.appendChild(tpsTextNode);

    let before = performance.now(),
        tpsIdx = 0;
    const handle = setInterval(() => {
        const now = performance.now(),
            dt = (now - before) / 1_000;
        before = now;

        tpsList[tpsIdx] = 1 / dt;
        tpsIdx < FPS_SAMPLE_AMOUNT ? tpsIdx++ : tpsIdx = 0;
        tpsTextNode.textContent = avgTps().toPrecision(3);

        const dtPrime = Math.min(dt, MIN_DT);
        c(dtPrime);
        tickTimers(dtPrime);
    }, 1);
    return () => {
        tpsTextNode.remove();
        tpsText.remove();
        clearInterval(handle);
    }
}

export type Timer
    = [c: Function, t: number]
    | [c: Function, t: number, repeat: true, _t: number];
const timers: Timer[] = [];

function tickTimers(dt: number) {
    for (let i = 0; i < timers.length; i++) {
        const timer = timers[i];
        timer[1] -= dt;
        if (timer[1] > 0) continue;
        timer[0]();
        if (timer[2]) {
            // @ts-ignore
            timer[1] = timer[3];
            continue;
        }
        timers.splice(i, 1);
        i--;
    }
}

export function timeout(c: Function, t: number) {
    const timer: Timer = [c, t];
    timers.push(timer)
    return timer;
}

export function repeatedTimeout(c: Function, t: number) {
    const timer: Timer = [c, t, true, t];
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
