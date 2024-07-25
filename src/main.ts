import { isPressed, listenToInput, stopListeningToInput } from './input';
import { Vector2D } from './math';
import { Default } from './player';
import { clearScreen, renderLoop, setupRender } from './render';
import './style.css'

listenToInput();
setupRender();

const player = new Default(
    Vector2D.xy(-100, -100),
    [1, 0.2, 0.3, 1],
    {},
);

const stop = renderLoop((dt: number) => {
    clearScreen();

    player.render();
    player.update(dt);

    if (!isPressed("q")) return;
    stopListeningToInput();
    stop();
});
