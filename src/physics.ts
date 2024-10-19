import { Vector2D } from "./math.ts";
import {
    circleToGeometry,
    circleToLines,
    defaultCircleColor,
    defaultCircleLinesColor,
    defaultRectColor,
    defaultRectLinesColor,
    fillGeometry,
    fillLines,
    GLColor,
    rectToGeometry,
    rectToLines,
} from "./render.ts";

export type RectangleHitbox = {
    type: "rect";
    offset: Vector2D;
    w: number;
    h: number;
};

export type CircleHitbox = {
    type: "circle";
    offset: Vector2D;
    r: number;
};

export type Hitbox =
    | RectangleHitbox
    | CircleHitbox;

export function isCollidingRR(
    p1: Vector2D,
    h1: RectangleHitbox,
    p2: Vector2D,
    h2: RectangleHitbox,
) {
    const aCenter = p1.clone().av(h1.offset),
        a = [
            aCenter.x - h1.w / 2,
            aCenter.y - h1.h / 2,
            aCenter.x + h1.w / 2,
            aCenter.y + h1.h / 2,
        ],
        bCenter = p2.clone().av(h2.offset),
        b = [
            bCenter.x - h2.w / 2,
            bCenter.y - h2.h / 2,
            bCenter.x + h2.w / 2,
            bCenter.y + h2.h / 2,
        ];

    return !(
        (a[3] < b[1]) ||
        (a[1] > b[3]) ||
        (a[2] < b[0]) ||
        (a[0] > b[2])
    );
}

export function isColliding(
    p1: Vector2D,
    h1: Hitbox,
    p2: Vector2D,
    h2: Hitbox,
) {
    switch (h1.type) {
        case "rect":
            switch (h2.type) {
                case "rect":
                    return isCollidingRR(p1, h1, p2, h2);
                case "circle":
                    throw "No circles yet!";
            }
            break;
        case "circle":
            throw "No circles yet!";
    }
}

const circleGeometry = circleToGeometry(Vector2D.zero(), 1),
    circleLines = circleToLines(Vector2D.zero(), 1);

export function drawHitbox(hitbox: Hitbox, pos: Vector2D, tint: GLColor) {
    switch (hitbox.type) {
        case "rect": {
            const x1 = pos.x - hitbox.w / 2,
                y1 = pos.y - hitbox.h / 2,
                x2 = pos.x + hitbox.w / 2,
                y2 = pos.y + hitbox.h / 2;
            fillGeometry(
                rectToGeometry([x1, y1, x2, y2]),
                defaultRectColor,
                { tint: [tint[0], tint[1], tint[2], tint[3] / 5] },
            );
            fillLines(
                rectToLines([x1, y1, x2, y2]),
                defaultRectLinesColor,
                { tint },
            );
            break;
        }
        case "circle": {
            const translation = Vector2D.add(hitbox.offset, pos),
                scale = Vector2D.xy(hitbox.r, hitbox.r);
            fillGeometry(
                circleGeometry,
                defaultCircleColor,
                {
                    tint: [tint[0], tint[1], tint[2], tint[3] / 5],
                    translation,
                    scale,
                },
            );
            fillLines(
                circleLines,
                defaultCircleLinesColor,
                { tint, translation, scale },
            );
            break;
        }
    }
}

export type PhysicsBody = typeof _PhysicsBody;
const _PhysicsBody = {
    pos: Vector2D.zero(),
    vel: Vector2D.zero(),
    elasticity: 0.6,
    xDrag: 0.25,
    yDrag: 0.25,
    rot: 0,
    angVel: 0,
    angDrag: 0.25,

    update(dt: number) {
        this.pos.av(this.vel.clone().Sn(dt));
        this.vel.Sxy(
            Math.exp(dt * Math.log(this.xDrag)),
            Math.exp(dt * Math.log(this.yDrag)),
        );
        this.rot += this.angVel * dt;
        this.angVel = Math.exp(dt * Math.log(this.angDrag));
    },
};

type PhysicsBodyParams = {
    pos?: Vector2D;
    vel?: Vector2D;
    elasticity?: number;
    xDrag?: number;
    yDrag?: number;
    rot?: number;
    angVel?: number;
    angDrag?: number;
};
export function makePhysicsBody(params: PhysicsBodyParams) {
    params.pos ??= Vector2D.zero();
    params.vel ??= Vector2D.zero();
    return Object.setPrototypeOf(params, _PhysicsBody) as PhysicsBody;
}
