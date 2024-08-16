import { DEBUG_HITBOXES, TEX_TO_SCREEN_RATIO } from "./flags";
import { Vector2D } from "./math";
import { drawHitbox, isColliding, RectangleHitbox } from "./physics";
import { Player } from "./player";
import { GLColor, defaultRectColor, drawGeometry, loadImage, rectToGeometry } from "./render";
import dirtImg from "./assets/platforms/dirt.png";
import grassImg from "./assets/platforms/grass.png";
import stoneImg from "./assets/platforms/stone.png";

export type Platform = {
    pos: Vector2D;
    hitbox: RectangleHitbox;
    isPhaseable: boolean;
    update(dt: number): void;
    render(): void;
    onCollision(p: Player): void;
};

export function resolvePlatformPlayerCollisions(
    platforms: Platform[],
    players: Player[],
) {
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
    }
}

const dirtTex = await loadImage(dirtImg),
    dirtColor: GLColor = [.6, .3, .1, 1],
    grassTex = await loadImage(grassImg),
    grassColor: GLColor = [.3, .93, .1, 1];
export class GrassPlatform implements Platform {
    dirtTexCoord: Float32Array;
    grassTexCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    isPhaseable = true;

    constructor(
        public pos: Vector2D,
        public w: number,
        public h: number,
    ) {
        const x = pos.x % 16 / TEX_TO_SCREEN_RATIO,
            y = pos.y % 16 / TEX_TO_SCREEN_RATIO;
        this.grassTexCoord = rectToGeometry([
            x, 0,
            x + w / TEX_TO_SCREEN_RATIO, h / TEX_TO_SCREEN_RATIO,
        ]);
        this.dirtTexCoord = rectToGeometry([
            x, y,
            x + w / TEX_TO_SCREEN_RATIO, y + h / TEX_TO_SCREEN_RATIO,
        ]);

        this.triangles = rectToGeometry([
            this.pos.x - this.w / 2, this.pos.y - this.h / 2,
            this.pos.x + this.w / 2, this.pos.y + this.h / 2,
        ]);
        this.hitbox = { type: 'rect', offset: Vector2D.zero(), w, h };
    }

    update(dt: number) {
        dt;
    }

    render() {
        drawGeometry(
            dirtTex,
            this.dirtTexCoord,
            this.triangles,
            defaultRectColor,
            { tint: dirtColor, repeatX: true, repeatY: true },
        );

        drawGeometry(
            grassTex,
            this.grassTexCoord,
            this.triangles,
            defaultRectColor,
            { tint: grassColor, repeatX: true, mirroredX: true },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.pos,
            [0, 0, 1, 1],
        );
    }

    onCollision(_: Player) { }
}

const stoneTex = await loadImage(stoneImg),
    stoneColor: GLColor = [.5, .6, .7, 1];
export class StonePlatform implements Platform {
    texCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    isPhaseable = false;

    constructor(
        public pos: Vector2D,
        public w: number,
        public h: number,
    ) {
        const x = pos.x % 16 / TEX_TO_SCREEN_RATIO,
            y = pos.y % 16 / TEX_TO_SCREEN_RATIO;
        this.texCoord = rectToGeometry([
            x, y,
            x + w / TEX_TO_SCREEN_RATIO, y + h / TEX_TO_SCREEN_RATIO,
        ]);

        this.triangles = rectToGeometry([
            this.pos.x - w / 2, this.pos.y - h / 2,
            this.pos.x + w / 2, this.pos.y + h / 2,
        ]);
        this.hitbox = { type: 'rect', offset: Vector2D.zero(), w, h };
    }

    update(dt: number) {
        dt;
    }

    render() {
        drawGeometry(
            stoneTex,
            this.texCoord,
            this.triangles,
            defaultRectColor,
            {
                tint: stoneColor,
                repeatX: true, repeatY: true,
                mirroredX: true, mirroredY: true,
            },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.pos,
            [0, 0, 1, 1],
        );
    }

    onCollision(p: Player) {
        p; // generate particles!!
    }
}
