import { isPressed, listenToInput, stopListeningToInput } from './input';
import { clearScreen, Color, drawRect, loadImage, renderLoop, setupRender } from './render';
import defaultImg from "./assets/classes/default.png";
import './style.css'

listenToInput();
setupRender();

const defaultTex = await loadImage(defaultImg),
    color1: Color = [Math.random(), Math.random(), Math.random(), 1],
    color2: Color = [Math.random(), Math.random(), Math.random(), 1];

let r = 0;

const stop = renderLoop((dt: number) => {
    clearScreen();

    drawRect(
        defaultTex,
        [0, 0, 32, 32],
        [-100, -100, 100, 100],
        { tint: color1, rotation: r },
    );

    drawRect(
        defaultTex,
        [2, 2, 6, 6],
        [-250, -250, -150, -150],
        { tint: color2, rotation: -r },
    );

    color1[Math.floor(Math.random() * 3)] += 2 * dt * (Math.random() - .5);
    color2[Math.floor(Math.random() * 3)] += 2 * dt * (Math.random() - .5);
    for (let i = 0; i < 3; i++) {
        color1[i] = Math.max(0, Math.min(color1[i], 1));
        color2[i] = Math.max(0, Math.min(color2[i], 1));
    }

    r += dt * Math.PI;

    if (!isPressed("q")) return;
    stopListeningToInput();
    stop();
});
