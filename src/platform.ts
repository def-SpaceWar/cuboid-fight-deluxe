import { DEBUG_HITBOXES, TEX_TO_SCREEN_RATIO } from "./flags.ts";
import { Vector2D } from "./math.ts";
import { drawHitbox, isColliding, RectangleHitbox } from "./physics.ts";
import { Player } from "./player.ts";
import {
    defaultRectColor,
    drawGeometry,
    GLColor,
    loadImage,
    rectToGeometry,
} from "./render.ts";
import dirtImg from "./assets/platforms/dirt.png";
import grassImg from "./assets/platforms/grass.png";
import stoneImg from "./assets/platforms/stone.png";
import stoneWallImg from "./assets/platforms/stone_wall.png";
import deathImg from "./assets/platforms/death.png";

export type Platform = {
    pos: Vector2D;
    hitbox: RectangleHitbox;
    readonly isPhaseable: boolean;
    readonly isWall: boolean;
    update(): void;
    render(): void;
    onCollision(p: Player, index: number): void;
};

export function resolvePlatformPlayerCollisions(
    platforms: Platform[],
    players: Player[],
) {
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        for (let j = 0; j < platforms.length; j++) {
            for (let k = 0; k < players[i].physicsBodies.length; k++) {
                const platform = platforms[j];
                if (
                    !platform.isWall && (player.physicsBodies[k].vel.y < 0 ||
                        player.physicsBodies[k].pos.y >
                            platform.pos.y + platform.hitbox.offset.y)
                ) continue;
                if (
                    !isColliding(
                        player.physicsBodies[k].pos,
                        player.hitboxes[k],
                        platform.pos,
                        platform.hitbox,
                    )
                ) continue;

                platform.onCollision(player, k);
                player.onPlatformCollision(platform, k);
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
    readonly isPhaseable = true;
    readonly isWall = false;

    constructor(
        public pos: Vector2D,
        public w: number,
        public h: number,
    ) {
        const x = pos.x % 16 / TEX_TO_SCREEN_RATIO,
            y = pos.y % 16 / TEX_TO_SCREEN_RATIO;
        this.grassTexCoord = rectToGeometry([
            x,
            0,
            x + w / TEX_TO_SCREEN_RATIO,
            h / TEX_TO_SCREEN_RATIO,
        ]);
        this.dirtTexCoord = rectToGeometry([
            x,
            y,
            x + w / TEX_TO_SCREEN_RATIO,
            y + h / TEX_TO_SCREEN_RATIO,
        ]);

        this.triangles = rectToGeometry([
            this.pos.x - this.w / 2,
            this.pos.y - this.h / 2,
            this.pos.x + this.w / 2,
            this.pos.y + this.h / 2,
        ]);
        this.hitbox = { type: "rect", offset: Vector2D.zero(), w, h };
    }

    update() {
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

        if (DEBUG_HITBOXES) {
            drawHitbox(
                this.hitbox,
                this.pos,
                [0, 0, 1, 1],
            );
        }
    }

    onCollision(_p: Player, _index: number) {
    }
}

const stoneTex = await loadImage(stoneImg),
    stoneColor: GLColor = [.5, .6, .7, 1];
export class StonePlatform implements Platform {
    texCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    readonly isPhaseable = false;
    readonly isWall = false;

    constructor(
        public pos: Vector2D,
        public w: number,
        public h: number,
    ) {
        const x = pos.x % 16 / TEX_TO_SCREEN_RATIO,
            y = pos.y % 16 / TEX_TO_SCREEN_RATIO;
        this.texCoord = rectToGeometry([
            x,
            y,
            x + w / TEX_TO_SCREEN_RATIO,
            y + h / TEX_TO_SCREEN_RATIO,
        ]);

        this.triangles = rectToGeometry([
            this.pos.x - w / 2,
            this.pos.y - h / 2,
            this.pos.x + w / 2,
            this.pos.y + h / 2,
        ]);
        this.hitbox = { type: "rect", offset: Vector2D.zero(), w, h };
    }

    update() {
    }

    render() {
        drawGeometry(
            stoneTex,
            this.texCoord,
            this.triangles,
            defaultRectColor,
            {
                tint: stoneColor,
                repeatX: true,
                repeatY: true,
                mirroredX: true,
                mirroredY: true,
            },
        );

        if (DEBUG_HITBOXES) {
            drawHitbox(
                this.hitbox,
                this.pos,
                [0, 0, 1, 1],
            );
        }
    }

    onCollision(_p: Player, _index: number) {
    }
}

const stoneWallTex = await loadImage(stoneWallImg),
    stoneWallColor: GLColor = [.75, .825, .9, 1];
export class StoneWall implements Platform {
    texCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    readonly isPhaseable = false;
    readonly isWall = true;

    constructor(
        public pos: Vector2D,
        public w: number,
        public h: number,
    ) {
        const x = pos.x % 16 / TEX_TO_SCREEN_RATIO,
            y = pos.y % 16 / TEX_TO_SCREEN_RATIO;
        this.texCoord = rectToGeometry([
            x,
            y,
            x + w / TEX_TO_SCREEN_RATIO,
            y + h / TEX_TO_SCREEN_RATIO,
        ]);

        this.triangles = rectToGeometry([
            this.pos.x - w / 2,
            this.pos.y - h / 2,
            this.pos.x + w / 2,
            this.pos.y + h / 2,
        ]);
        this.hitbox = { type: "rect", offset: Vector2D.zero(), w, h };
    }

    update() {
    }

    render() {
        drawGeometry(
            stoneWallTex,
            this.texCoord,
            this.triangles,
            defaultRectColor,
            {
                tint: stoneWallColor,
                repeatX: true,
                repeatY: true,
                mirroredX: false,
                mirroredY: false,
            },
        );

        if (DEBUG_HITBOXES) {
            drawHitbox(
                this.hitbox,
                this.pos,
                [0, 0, 1, 1],
            );
        }
    }

    onCollision(_p: Player, _index: number) {
    }
}

const deathTex = await loadImage(deathImg),
    deathColor: GLColor = [1, 0.2, 0.4, 1];
export class DeathPlatform implements Platform {
    texCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    readonly isPhaseable = false;
    readonly isWall = true;

    constructor(
        public pos: Vector2D,
        public w: number,
        public h: number,
    ) {
        const x = pos.x % 16 / TEX_TO_SCREEN_RATIO,
            y = pos.y % 16 / TEX_TO_SCREEN_RATIO;
        this.texCoord = rectToGeometry([
            x,
            y,
            x + w / TEX_TO_SCREEN_RATIO,
            y + h / TEX_TO_SCREEN_RATIO,
        ]);

        this.triangles = rectToGeometry([
            this.pos.x - w / 2,
            this.pos.y - h / 2,
            this.pos.x + w / 2,
            this.pos.y + h / 2,
        ]);
        this.hitbox = { type: "rect", offset: Vector2D.zero(), w, h };
    }

    update() {
    }

    render() {
        drawGeometry(
            deathTex,
            this.texCoord,
            this.triangles,
            defaultRectColor,
            {
                tint: deathColor,
                repeatX: true,
                repeatY: true,
                mirroredX: false,
                mirroredY: false,
            },
        );

        if (DEBUG_HITBOXES) {
            drawHitbox(
                this.hitbox,
                this.pos,
                [0, 0, 1, 1],
            );
        }
    }

    onCollision(p: Player, _index: number) {
        if (!p.isDead) p.takeDamage(10, { type: "environment" });
    }
}
