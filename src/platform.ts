import { DEBUG_HITBOXES } from "./flags";
import { Vector2D } from "./math";
import { drawHitbox, RectangleHitbox } from "./physics";
import { Player } from "./player";
import { fillRect, rectToGL } from "./render";

export type Platform = {
    pos: Vector2D;
    hitbox: RectangleHitbox;
    isPhaseable: boolean;
    update(dt: number): void;
    render(): void;
    onCollision(p: Player): void;
};

export class GrassPlatform implements Platform {
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    isPhaseable = true;

    constructor(public pos: Vector2D, w: number, h: number) {
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
        fillRect(
            this.triangles,
            { tint: [0, 1, 0, 1] },
        );

        if (DEBUG_HITBOXES) drawHitbox(
            this.hitbox,
            this.pos,
            [0, 0, 1, 1],
        );
    }

    onCollision(_: Player) {}
}

export class StonePlatform implements Platform {
    triangles: Float32Array;
    hitbox: RectangleHitbox;
    isPhaseable = false;

    constructor(public pos: Vector2D, w: number, h: number) {
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
        fillRect(
            this.triangles,
            { tint: [.6, .6, .6, 1] },
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
