import { setupRender } from "./render.ts";
import { JoinOrCreateLobby, Scene } from "./scene.ts";
import "./style.css";

setupRender();

for (
    let scene: Scene = new JoinOrCreateLobby();
    (scene = await scene.run());
);
