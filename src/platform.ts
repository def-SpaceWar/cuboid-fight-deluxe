import { DEBUG_HITBOXES } from "./flags";
import { Vector2D } from "./math";
import { drawHitbox, RectangleHitbox } from "./physics";
import { Player } from "./player";
import { drawRect, loadImage, rectToGL } from "./render";
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

const dirtTex = await loadImage(dirtImg),
    grassTex = await loadImage(grassImg);
export class GrassPlatform implements Platform {
    dirtTexCoord: Float32Array;
    grassTexCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    isPhaseable = true;

    constructor(public pos: Vector2D, w: number, h: number) {
        {
            const x = Math.floor(Math.random() * 16),
                scaleFactor = 4;
            this.grassTexCoord = rectToGL([
                x, 0,
                x + w / scaleFactor, h / scaleFactor,
            ]);
        }
        {
            const x = Math.floor(Math.random() * 16),
                y = Math.floor(Math.random() * 16),
                scaleFactor = 4;
            this.dirtTexCoord = rectToGL([
                x, y,
                x + w / scaleFactor, y + h / scaleFactor,
            ]);
        }

        this.triangles = rectToGL([
            this.pos.x - w / 2, this.pos.y - h / 2,
            this.pos.x + w / 2, this.pos.y + h / 2,
        ]);
        this.hitbox = { type: 'rect', offset: Vector2D.zero(), w, h };
    }

    update(dt: number) {
        dt;
    }

    render() {
        drawRect(
            dirtTex,
            this.dirtTexCoord,
            this.triangles,
            { tint: [.65, .32, .1, 1] },
        );

        drawRect(
            grassTex,
            this.grassTexCoord,
            this.triangles,
            { tint: [.4, 1, .1, 1] },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.pos,
            [0, 0, 1, 1],
        );
    }

    onCollision(_: Player) { }
}

const stoneTex = await loadImage(stoneImg);
export class StonePlatform implements Platform {
    texCoord: Float32Array;
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    isPhaseable = false;

    constructor(public pos: Vector2D, w: number, h: number) {
        const x = Math.floor(Math.random() * 16),
            y = Math.floor(Math.random() * 16),
            scaleFactor = 4;
        this.texCoord = rectToGL([
            x, y,
            x + w / scaleFactor, y + h / scaleFactor,
        ]);

        this.triangles = rectToGL([
            this.pos.x - w / 2, this.pos.y - h / 2,
            this.pos.x + w / 2, this.pos.y + h / 2,
        ]);
        this.hitbox = { type: 'rect', offset: Vector2D.zero(), w, h };
    }

    update(dt: number) {
        dt;
    }

    render() {
        drawRect(
            stoneTex,
            this.texCoord,
            this.triangles,
            { tint: [.5, .6, .7, 1] },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.pos,
            [0, 0, 1, 1],
        );
    }

    onCollision(p: Player) {
        p;
    }
}
