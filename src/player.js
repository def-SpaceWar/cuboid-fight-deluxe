import {
    PhysicsBody$new,
    PhysicsBody$transform,
    PhysicsBody$update,
    PolygonCollider$new
} from './physics';
import { Rectangle2D$new } from './render';

/** @typedef {import('./physics').PhysicsBody} PhysicsBody */

const Player = {
    isGrounded: false,

    /** @type PhysicsBody */
    physics: undefined,

    /** @type Render[] */
    renders: undefined,
};

export function Player$render(p, ctx) {
    ctx.save();
    PhysicsBody$transform(p.physics, ctx);
    for (const render of p.renders) render.render(ctx);
    ctx.restore();
};

export function Player$update(p, dt) {
    PhysicsBody$update(p.physics, dt);
};

export const Player$Default = (params = {}, physicsParams = {}) =>
    Object.setPrototypeOf({
        physics: PhysicsBody$new({
            lockRotation: true,
            colliders: [PolygonCollider$new({
                points: [
                    { x: -10, y: -10 },
                    { x: -10, y: 10 },
                    { x: 10, y: 10 },
                    { x: 10, y: -10 },
                ],
            })],
            ...physicsParams,
        }),
        renders: [Rectangle2D$new()],
        ...params,
    }, Player);
