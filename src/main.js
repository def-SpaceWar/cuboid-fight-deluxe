// @ts-check
import { Player$new } from './player';
import { Ellipse2D$new, Rectangle2D$new } from './render';
import { getKey, listenKeys, stopKeys } from './input';
import './style.css';

const app = document.querySelector('#app');
if (!app) throw new Error("Something went wrong!");

const canvas = app.appendChild(document.createElement("canvas"));

/** @type CanvasRenderingContext2D */
// @ts-ignore
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d context couldn't be loaded!");
ctx.imageSmoothingEnabled = false;
canvas.width = 800;
canvas.height = 600;

const resizeCanvas = () => {
    const scaleX = window.innerWidth / canvas.width,
        scaleY = window.innerHeight / canvas.height,
        scale = Math.max(scaleX, scaleY) + 0.000001;
    canvas.style.transform = `translate(-50%, -50%) scale(${scale}, ${scale})`;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
 
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
    const now = performance.now() / 1000;
    dt = Math.min(0.05, now - before);
    before = now;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    ctx.restore();

    if (getKey("q")) return stop();
    return cont();
}
