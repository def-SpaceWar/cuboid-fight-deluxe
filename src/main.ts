import { listenToInput } from './input';
import { Binding, Default, Player } from './player';
import { RGBAColor, setupRender } from './render';
import { Map1 } from './map';
import './style.css'
import { Stock } from './gamemode';

listenToInput();
setupRender();

const players: Player[] = [],
    map = new Map1(new Stock(4));

players.push(
    new Default(
        new RGBAColor(1, .2, .3),
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
        map,
    ),
    new Default(
        new RGBAColor(0, .5, 1),
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
        map,
    ),
    //new Default(
    //    new RGBAColor(.2, 1, .3),
    //    {
    //        left: Binding.key('aa'),
    //        up: Binding.key('aa'),
    //        down: Binding.key('aa'),
    //        right: Binding.key('aa'),
    //        attack: Binding.key('aa'),
    //        special: Binding.key('aa'),
    //    },
    //    3,
    //    players,
    //    map,
    //),
    //new Default(
    //    new RGBAColor(1, .8, .3),
    //    {
    //        left: Binding.key('aa'),
    //        up: Binding.key('aa'),
    //        down: Binding.key('aa'),
    //        right: Binding.key('aa'),
    //        attack: Binding.key('aa'),
    //        special: Binding.key('aa'),
    //    },
    //    4,
    //    players,
    //    map,
    //),
);

await map.run(players);
