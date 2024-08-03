import { setupRender } from './render';
import { GameMap, Map1 } from './map';
import './style.css'

setupRender();

const startingMap = new Map1();
for (
    let map: GameMap = startingMap;
    map = await map.run();
);
