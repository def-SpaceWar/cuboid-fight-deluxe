import { Player$New } from './player';
import { BasicPhysics$New } from './physics';
import { Rectangle2D$New } from './render';
import './style.css'

const app = document.querySelector('#app');
if (!app) throw new Error("Something went wrong!");

const canvas = app.appendChild(document.createElement("canvas")),
    ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d context couldn't be loaded!");

const setCanvasDim = () => [canvas.width, canvas.height]
    = [window.innerWidth, window.innerHeight];
setCanvasDim();
window.addEventListener("resize", setCanvasDim);

const
    myPlayer = Player$New(),
    myPlayer2 = Player$New({
        physics: BasicPhysics$New({ x: -150, gravity: -250 }),
        renders: [Rectangle2D$New({ color: "blue" })]
    });

let before = performance.now() / 1000,
    dt = 0,
    process = requestAnimationFrame(game);

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

    return process = requestAnimationFrame(game);
}

setTimeout(() => {
    cancelAnimationFrame(process);
}, 750);
