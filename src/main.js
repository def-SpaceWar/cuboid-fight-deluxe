import { Player$Default } from './player';
import {
    Vector$new,
    PolygonCollider$new,
    EllipticalCollider$new,
    resolveCollision,
    clearCollisionEvents
} from './physics';
import { Ellipse2D$new, FilterEffect$new, Rectangle2D$new } from './render';
import { getKey, listenKeys, stopKeys } from './input';
import './style.css';
import { Platform$new } from './platform';

const app = document.querySelector('#app');
if (!app) throw new Error("Something went wrong!");

const canvas = app.appendChild(document.createElement("canvas")),
    ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d context couldn't be loaded!");
ctx.webkitImageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;
canvas.width = 800;
canvas.height = 600;

const resizeCanvas = () => {
    const scaleX = window.innerWidth / canvas.width,
        scaleY = window.innerHeight / canvas.height,
        scale = Math.max(scaleX, scaleY);
    canvas.style.transform = `translate(-50%, -50%) scale(${scale}, ${scale})`;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const
    myPlayer = Player$Default(),
    myPlayer2 = Player$Default({
        renders: [
            Ellipse2D$new({
                color: "#00f",
                w: 30,
                h: 30,
                effects: [FilterEffect$new({
                    dropShadows: [
                        { blurRadius: 4, color: "#f00" },
                        {
                            blurRadius: 8,
                            offsetX: 4,
                            offsetY: 4,
                            color: "#0f0"
                        },
                    ],
                })]
            }),
            Rectangle2D$new({
                color: "#ff0",
                x: 15,
                y: 0,
                w: 30,
                h: 5,
            }),
        ],
    }, {
        pos: Vector$new({ x: -30 }),
        vel: Vector$new({ x: 30 }),
        mass: 2.25,
        angVel: 1.5,
        colliders: [
            EllipticalCollider$new({
                w: 30,
                h: 30,
            }),
            PolygonCollider$new({
                points: [
                    { x: 0, y: -2.5 },
                    { x: 30, y: -2.5 },
                    { x: 30, y: 2.5 },
                    { x: 0, y: 2.5 },
                ],
            }),
        ]
    }),
    myPlatform = Platform$new();

listenKeys();
let before = performance.now() / 1000,
    dt = 0,
    renderLoop = requestAnimationFrame(render),
    updateInterval = setInterval(update, 0);

function cont() {
    renderLoop = requestAnimationFrame(render);
}

function stop() {
    stopKeys();
    clearInterval(updateInterval);
    cancelAnimationFrame(renderLoop);
}

function update() {
    clearCollisionEvents();
    resolveCollision(myPlayer.physics, myPlayer2.physics);
    resolveCollision(myPlayer.physics, myPlatform.physics);
    resolveCollision(myPlayer2.physics, myPlatform.physics);

    myPlayer2.update(dt);
    myPlayer.update(dt);

    const now = performance.now() / 1000;
    dt = Math.min(0.05, now - before);
    before = now;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    myPlayer.render(ctx);
    myPlayer2.render(ctx);
    myPlatform.render(ctx);

    ctx.restore();

    if (getKey("q")) return stop();
    return cont();
}
