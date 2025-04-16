import { DT } from "./flags.ts";
import { updateLoop } from "./loop.ts";

export abstract class Particle {
    birthTick: number;
    abstract lifespan: number;
    abstract renderZ: number;

    constructor() {
        particles.push(this);
        this.birthTick = updateLoop.gameTick;
    }

    abstract render(): void;

    update() {
        this.lifespan -= DT;
        if (this.lifespan > 0) return;
        particles = particles.filter((p) => p != this);
    }
}

export let particles: Particle[] = [];
export function rollbackParticles(tick: number) {
    particles = particles.filter((p) => p.birthTick < tick);
}
