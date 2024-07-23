import { Vector2D } from "./math";

let keys = new Set<string>;
export let isMouseDown = false;
let mouseCoords = Vector2D.zero();

export const isPressed = (k: string) => keys.has(k);
export const getMouseCoords = () => mouseCoords.clone();

const listeners = {
    "keydown": (e: KeyboardEvent) => keys.add(e.key),
    "keyup": (e: KeyboardEvent) => keys.delete(e.key),
    "mousedown": () => isMouseDown = true,
    "mouseup": () => isMouseDown = false,
    "mousemove": (e: MouseEvent) => mouseCoords.sxy(e.clientX, e.clientY),
};

export function listenToInput() {
    for (const type of Object.keys(listeners))
        // @ts-ignore
        document.addEventListener(type, listeners[type]);
}

export function stopListeningToInput() {
    keys = new Set<string>;
    mouseCoords = Vector2D.zero();
    isMouseDown = false;

    for (const type of Object.keys(listeners))
        // @ts-ignore
        document.removeEventListener(type, listeners[type]);
}
