import { isPressed, listenToInput, stopListeningToInput } from './input';
import { Vector2D } from './math';
import { isColliding } from './physics';
import { GrassPlatform, Platform, StonePlatform } from './platform';
import { Binding, Default, Player } from './player';
import { clearScreen, RGBAColor, setupRender } from './render';
import { renderLoop, timeout, updateLoop } from './loop';
import './style.css'
import { toggleHitboxes } from './flags';

listenToInput();
setupRender();

const players: Player[] = [];
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
    ),
    //new Default(
    //    Vector2D.x(475),
    //    new RGBAColor(0.2, 1, .3),
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
    //),
    //new Default(
    //    Vector2D.x(-200),
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
    //),
);

const platforms: Platform[] = [
    new StonePlatform(Vector2D.xy(0, 150), 200, 25),
    new GrassPlatform(Vector2D.xy(-100, 300), 500, 100),
    new StonePlatform(Vector2D.xy(500, 50), 150, 15),
    new GrassPlatform(Vector2D.xy(-300, -200), 300, 45),
    new GrassPlatform(Vector2D.xy(-100, -300), 300, 35),
    new GrassPlatform(Vector2D.xy(300, -100), 300, 35),
    new StonePlatform(Vector2D.xy(500, 300), 350, 200),
];

const stopRender = renderLoop(() => {
    clearScreen();
    for (let i = 0; i < platforms.length; i++) platforms[i].render();
    for (let i = 0; i < players.length; i++) players[i].render();
});

let canToggleHitboxes = true;
const stopUpdate = updateLoop((dt: number) => {
    for (let i = 0; i < platforms.length; i++) platforms[i].update(dt);
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (player.physicsBody.vel.y > 0) {
            for (let j = 0; j < platforms.length; j++) {
                const platform = platforms[j];
                if (
                    player.physicsBody.pos.y >
                    platform.pos.y + platform.hitbox.offset.y
                ) continue;
                if (!isColliding(
                    player.physicsBody.pos, player.hitbox,
                    platform.pos, platform.hitbox,
                )) continue;

                player.onPlatformCollision(platform);
                platform.onCollision(player);
            }
        }
        player.update(dt);
    }

    if (canToggleHitboxes && isPressed("Escape")) {
        canToggleHitboxes = false;
        timeout(() => canToggleHitboxes = true, .2);
        toggleHitboxes();
    }

    if (!isPressed("Enter")) return;
    stopListeningToInput();
    stopRender();
    stopUpdate();
});
