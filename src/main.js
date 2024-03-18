// @ts-check
import { getKey, listenKeys, stopKeys } from './input';
import { fillScreenCanvas } from './render';
import './style.css';

window.onload = async () => {
    const app = document.querySelector('#app');
    if (!app) throw new Error("Something went wrong!");

    const canvas = app.appendChild(document.createElement("canvas")),
        gl = canvas.getContext("webgl2");
    if (!gl) throw new Error("WebGL couldn't be loaded!");

    const stopFillScreen = fillScreenCanvas(canvas);
    listenKeys();

    stopKeys;
    stopFillScreen;
};
