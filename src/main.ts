import { setupRender } from "./render.ts";
import { MainMenu, Scene } from "./scene.ts";
import "./style.css";

setupRender();

for (
    let scene: Scene = new MainMenu();
    (scene = await scene.run());
);
