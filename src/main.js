import { Player$Default } from './player';
import {
    PhysicsBody$new,
    PhysicsBody$resolveCollision,
    Vector$new,
    PolygonCollider$new
} from './physics';
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
        physics: PhysicsBody$new({
            pos: Vector$new({ x: -150 }),
            vel: Vector$new({ x: 150 }),
            angVel: 2.5,
            colliders: [PolygonCollider$new({
                points: [
                    { x: -50, y: -50 },
                    { x: -50, y: 50 },
                    { x: 50, y: 50 },
                    { x: 50, y: -50 },
                ],
            })],
        }),
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
    }),
    myPlayer3 = Player$Default({
        physics: PhysicsBody$new({
            pos: Vector$new({ y: 150 }),
            vel: Vector$new({ x: 0, y: 0 }),
            gravity: 0,
            angVel: 0,
            mass: Infinity,
            colliders: [PolygonCollider$new({
                points: [
                    { x: -250, y: -25 },
                    { x: -250, y: 25 },
                    { x: 250, y: 25 },
                    { x: 250, y: -25 },
                ],
            })],
        }),
        renders: [
            Rectangle2D$new({
                w: 500,
                h: 50,
                color: "#0f0",
            }),
        ],
    })
    ;

let before = performance.now() / 1000,
    dt = 0,
    renderLoop = requestAnimationFrame(render),
    updateInterval = setInterval(update, 5);

function cont() {
    renderLoop = requestAnimationFrame(render);
}

function stop() {
    stopKeys();
    clearInterval(updateInterval);
    cancelAnimationFrame(renderLoop);
}

function update() {
    myPlayer3.update(dt);
    myPlayer2.update(dt);
    myPlayer.update(dt);

    PhysicsBody$resolveCollision(myPlayer.physics, myPlayer2.physics);
    PhysicsBody$resolveCollision(myPlayer.physics, myPlayer3.physics);
    PhysicsBody$resolveCollision(myPlayer2.physics, myPlayer3.physics);

    const now = performance.now() / 1000;
    dt = Math.min(0.1, now - before);
    before = now;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    myPlayer3.render(ctx);
    myPlayer2.render(ctx);
    myPlayer.render(ctx);

    ctx.restore();

    if (getKey("q")) return stop();
    return cont();
}
