import { Platform } from "./platform";

export interface Particle {
    lifespan: number;
    render(dt: number): void;
    onPlatformCollision(p: Platform): void;
}

export const particles: Particle[] = [];

export function renderParticles(dt: number) {
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle.render(dt);
        particle.lifespan -= dt;
        if (particle.lifespan > 0) continue;
        particles.splice(i, 1);
    }
}
