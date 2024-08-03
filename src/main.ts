import { setupRender } from './render';
import { Scene, MainMenu } from './scene';
import './style.css'

setupRender();

for (
    let scene: Scene = new MainMenu();
    scene = await scene.run();
);
