import { Map1 } from "./map";
import { clearScreen } from "./render";

const app = document.getElementById("app")!;

export interface Scene {
    run(): Promise<Scene>;
}

export class MainMenu implements Scene {
    run() {
        clearScreen();
        const button = app.appendChild(document.createElement("button"));
        button.id = "start-game";
        button.innerText = "Start Game";

        return new Promise<Scene>(resolve => {
            button.onclick = () => {
                button.remove();
                resolve(new Map1());
            }
        });
    }
}
