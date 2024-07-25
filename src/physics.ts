import { Vector2D } from "./math";
import { Color, fillRect, rectToGL } from "./render";

export type Hitbox = {
    type: 'rect';
    offset: Vector2D;
    w: number;
    h: number;
} | {
    type: 'circle',
    offset: Vector2D;
    r: number;
};

export function drawHitbox(hitbox: Hitbox, pos: Vector2D, tint: Color) {
    switch (hitbox.type) {
        case "rect":
            const x1 = pos.x - hitbox.w / 2,
                y1 = pos.y - hitbox.h / 2,
                x2 = pos.x + hitbox.w / 2,
                y2 = pos.y + hitbox.h / 2;
            fillRect(
                rectToGL([x1, y1, x2, y2]),
                { tint: [tint[0], tint[1], tint[2], tint[3] / 10] },
            );
            fillRect(
                rectToGL([x1 - 1, y1 - 1, x2 + 1, y1 + 1]),
                { tint },
            );
            fillRect(
                rectToGL([x2 - 1, y2 - 1, x2 + 1, y1 + 1]),
                { tint },
            );
            fillRect(
                rectToGL([x1 - 1, y2 - 1, x2 + 1, y2 + 1]),
                { tint },
            );
            fillRect(
                rectToGL([x1 - 1, y1 - 1, x1 + 1, y2 + 1]),
                { tint },
            );
            break;
        case "circle":
            break;
    }
}

export type PhysicsBody = typeof _PhysicsBody;
const _PhysicsBody = {
    pos: Vector2D.zero(),
    vel: Vector2D.zero(),
    mass: 1,
    xDrag: 0.25,
    yDrag: 0.25,

    update(dt: number) {
        this.pos.av(this.vel.clone().Sxyn(dt));
        this.vel.Sxy(
            Math.exp(dt * Math.log(this.xDrag)),
            Math.exp(dt * Math.log(this.yDrag)),
        );
    },
};

type PhysicsBodyParams = {
    pos?: Vector2D;
    vel?: Vector2D;
    mass?: number;
    xDrag?: number;
    yDrag?: number;
};
export function makePhysicsBody(params: PhysicsBodyParams) {
    params.pos ??= Vector2D.zero();
    params.vel ??= Vector2D.zero();
    return Object.setPrototypeOf(params, _PhysicsBody) as PhysicsBody;
}
