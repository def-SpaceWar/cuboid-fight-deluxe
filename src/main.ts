import { isPressed, listenToInput, stopListeningToInput } from './input';
import { Vector2D } from './math';
import { isColliding } from './physics';
import { GrassPlatform, Platform, StonePlatform } from './platform';
import { Binding, Default, Player } from './player';
import { clearScreen, renderLoop, setupRender } from './render';
import './style.css'

listenToInput();
setupRender();

const players: Player[] = [
    new Default(
        Vector2D.xy(-100, -100),
        [1, 0.2, 0.3, 1],
        {
            left: Binding.key('s'),
            up: Binding.key('e'),
            down: Binding.key('d'),
            right: Binding.key('f'),
            attack: Binding.key('w'),
            special: Binding.key('q'),
        },
    ),
];

const platforms: Platform[] = [
    new StonePlatform(Vector2D.xy(0, 200), 200, 15),
    new GrassPlatform(Vector2D.xy(-100, 300), 500, 45),
    new StonePlatform(Vector2D.xy(500, 50), 150, 15),
    new GrassPlatform(Vector2D.xy(-300, -200), 300, 45),
];

const stop = renderLoop((dt: number) => {
    clearScreen();

    for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        platform.update(dt);
        platform.render();
    }

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
        player.render();
        player.update(dt);
    }

    if (!isPressed("q")) return;
    stopListeningToInput();
    stop();
});
