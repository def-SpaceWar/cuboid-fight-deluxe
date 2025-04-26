import { Vector2D } from "./math.ts";

let keys = new Set<string>(),
    mouseButtons = new Float32Array(5),
    mouseCoords = Vector2D.zero();

export const isPressed = (k: string) => keys.has(k),
    isMousePressed = (btn: number) => mouseButtons[btn] == 1,
    getMouseCoords = () => mouseCoords.clone();

const listeners = {
    "keydown": (e: KeyboardEvent) => keys.add(e.code),
    "keyup": (e: KeyboardEvent) => keys.delete(e.code),
    "mousedown": (e: MouseEvent) => {
        e.preventDefault();
        mouseButtons[e.button] = 1;
    },
    "mouseup": (e: MouseEvent) => {
        e.preventDefault();
        mouseButtons[e.button] = 0;
    },
    "mousemove": (e: MouseEvent) => {
        e.preventDefault();
        mouseCoords.sxy(e.clientX, e.clientY);
    },
};

export function listenToInput() {
    for (const type of Object.keys(listeners)) {
        // @ts-ignore:
        document.addEventListener(type, listeners[type]);
    }
}

export function stopListeningToInput() {
    keys = new Set<string>();
    mouseButtons = new Float32Array(5);
    mouseCoords = Vector2D.zero();

    for (const type of Object.keys(listeners)) {
        // @ts-ignore:
        document.removeEventListener(type, listeners[type]);
    }
}
