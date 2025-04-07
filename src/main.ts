//import { Map1 } from "./map.ts";
import { setupRender } from "./render.ts";
import { JoinOrCreateLobby, Scene } from "./scene.ts";
import "./style.css";

setupRender();

//for (
//    let scene: Scene = new Map1();
//    (scene = await scene.run());
//);

for (
    let scene: Scene = new JoinOrCreateLobby();
    (scene = await scene.run());
);
