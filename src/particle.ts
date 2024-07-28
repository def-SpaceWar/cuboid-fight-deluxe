export type Particle
    // no collider,
    // anim(t: number): void (render as function of time),
    // lifetime: number,
    = { type: 'static' }
    // collider, pos, vel,
    // lifetime: number,
    | { type: 'physics' };
const particles: Particle[] = [];

export function updateParticles(dt: number) {
    throw "not implemented yet";
    dt;
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle;
    }
}

export function renderParticles() {
    throw "not implemented yet";
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        particle;
    }
}
