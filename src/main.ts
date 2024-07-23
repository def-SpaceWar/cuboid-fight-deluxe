import { listenToInput, stopListeningToInput } from './input';
import './style.css'
import { render } from './render';

listenToInput();
const canvas = document.getElementById("app")!
    .appendChild(document.createElement("canvas"));

render(canvas);

setTimeout(() => {
    stopListeningToInput();
}, 100_000);
