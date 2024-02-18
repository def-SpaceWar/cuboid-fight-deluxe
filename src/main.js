import { Player$Default } from './player';
import { BasicPhysicsBody$new } from './physics';
import { FilterEffect$new, Rectangle2D$new } from './render';
import { getKey, listenKeys, stopKeys } from './input';
import './style.css';

const app = document.querySelector('#app');
if (!app) throw new Error("Something went wrong!");

const canvas = app.appendChild(document.createElement("canvas")),
    ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d context couldn't be loaded!");

const resizeCanvas = () => [canvas.width, canvas.height]
    = [window.innerWidth, window.innerHeight];
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

listenKeys();

const
    myPlayer = Player$Default(),
    myPlayer2 = Player$Default({
        physics: BasicPhysicsBody$new({ x: -150, gravity: -500 }),
        renders: [
            Rectangle2D$new({
                color: "#00f",
                effects: [FilterEffect$new({
                    dropShadows: [
                        { blurRadius: 20, color: "#100" },
                        { offsetX: 20, color: "#010" },
                    ],
                    saturate: 10000,
                })]
            }),
        ],
    });

let before = performance.now() / 1000,
    dt = 0,
    process = requestAnimationFrame(game);

function cont() {
    process = requestAnimationFrame(game);
};

function stop() {
    stopKeys();
    return cancelAnimationFrame(process);
}

function game() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2)
    myPlayer.render(ctx)
    myPlayer2.render(ctx)
    myPlayer.update(dt);
    myPlayer2.update(dt);
    ctx.restore();

    const now = performance.now() / 1000;
    dt = now - before;
    before = now;

    if (getKey("q")) return stop();
    return cont();
}
