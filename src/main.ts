import { isPressed, listenToInput, stopListeningToInput } from './input';
import { Vector2D } from './math';
import { isColliding } from './physics';
import { GrassPlatform, Platform, StonePlatform } from './platform';
import { Binding, Default, Player } from './player';
import { clearScreen, renderLoop, setupRender, updateLoop } from './render';
import './style.css'

listenToInput();
setupRender();

const players: Player[] = [];
players.push(
    new Default(
        Vector2D.xy(-100, -100),
        [1, 0.2, 0.3, 1],
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
        Vector2D.xy(-200, -100),
        [0, 0.5, 1, 1],
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

    if (!isPressed("Enter")) return;
    stopListeningToInput();
    stopRender();
    stopUpdate();
});
