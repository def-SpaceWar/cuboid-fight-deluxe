import { timeout } from "./loop";
import { Vector2D } from "./math";

const app = document.getElementById("app")!;

export type Particle
    = { type: 'draw' }
    | { type: 'physics' };
const particles: Particle[] = [];

export function updateParticles(dt: number) {
    throw "not implemented yet";
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
    }
}

export function renderParticles() {
    throw "not implemented yet";
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
    }
}

export function createTextParticle(
    text: string,
    className: string,
    fontSize: number,
    pos: Vector2D,
    lifetime: number,
    isTopLeft: boolean = false,
) {
    const elem = app.appendChild(document.createElement("p"));
    elem.innerText = text;
    elem.className = className;
    elem.style.fontSize = `${fontSize | 0}px`;
    if (isTopLeft) {
        elem.style.left = `${pos.x | 0}px`;
        elem.style.top = `${pos.y | 0}px`;
    } else {
        elem.style.left = `calc(50vw + ${pos.x | 0}px)`;
        elem.style.top = `calc(50vh + ${pos.y | 0}px)`;
    }
    elem.style.animationDuration = `${lifetime}s`;
    elem.style.opacity = "0";
    timeout(() => app.removeChild(elem), lifetime);
}

export function createTextRender(
    text: string,
    className: string,
    fontSize: number,
    pos: Vector2D,
    isTopLeft: boolean = false,
) {
    const elem = app.appendChild(document.createElement("p"));
    elem.innerText = text;
    elem.className = className;
    elem.style.fontSize = `${fontSize}px`;
    if (isTopLeft) {
        elem.style.left = `${pos.x | 0}px`;
        elem.style.top = `${pos.y | 0}px`;
    } else {
        elem.style.left = `calc(50vw + ${pos.x | 0}px)`;
        elem.style.top = `calc(50vh + ${pos.y | 0}px)`;
    }
    return {
        elem,
        remove: () => app.removeChild(elem),
    };
}
