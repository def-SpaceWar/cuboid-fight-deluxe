import { listenToInput } from './input';
import { Vector2D } from './math';
import { Binding, Default, Player } from './player';
import { RGBAColor, setupRender } from './render';
import { Map1 } from './map';
import './style.css'

listenToInput();
setupRender();

const players: Player[] = [],
    scene = new Map1({ type: 'stock', lives: 4, teams: false });

players.push(
    new Default(
        Vector2D.x(-50),
        new RGBAColor(1, 0.2, 0.3),
        {
            left: Binding.key('ArrowLeft'),
            up: Binding.key('ArrowUp'),
            down: Binding.key('ArrowDown'),
            right: Binding.key('ArrowRight'),
            attack: Binding.key('/'),
            special: Binding.key('.'),
        },
        1,
        players,
        scene,
    ),
    new Default(
        Vector2D.x(375),
        new RGBAColor(0, 0.5, 1),
        {
            left: Binding.key('s'),
            up: Binding.key('e'),
            down: Binding.key('d'),
            right: Binding.key('f'),
            attack: Binding.key('w'),
            special: Binding.key('q'),
        },
        2,
        players,
        scene,
    ),
    /*
    new Default(
        Vector2D.x(475),
        new RGBAColor(0.2, 1, .3),
        {
            left: Binding.key('aa'),
            up: Binding.key('aa'),
            down: Binding.key('aa'),
            right: Binding.key('aa'),
            attack: Binding.key('aa'),
            special: Binding.key('aa'),
        },
        3,
        players,
        gamemode,
    ),
    new Default(
        Vector2D.x(-200),
        new RGBAColor(1, .8, .3),
        {
            left: Binding.key('aa'),
            up: Binding.key('aa'),
            down: Binding.key('aa'),
            right: Binding.key('aa'),
            attack: Binding.key('aa'),
            special: Binding.key('aa'),
        },
        4,
        players,
        gamemode,
    ),
    */
);

await scene.run(players);
