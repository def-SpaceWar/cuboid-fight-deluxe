import { Vector2D } from "./math";

const keys = new Set<string>;
const mouseCoords = Vector2D.zero();

export const getMouseCoords = () => mouseCoords.clone();

const listeners = {
    "keydown": (e: KeyboardEvent) => keys.add(e.key),
    "keyup": (e: KeyboardEvent) => keys.delete(e.key),
};

export function listenToInput() {
    for (const type of Object.keys(listeners))
        // @ts-ignore
        document.addEventListener(type, listeners[type]);
}

export function stopListeningToInput() {
    for (const type of Object.keys(listeners))
        // @ts-ignore
        document.removeEventListener(type, listeners[type]);
}
