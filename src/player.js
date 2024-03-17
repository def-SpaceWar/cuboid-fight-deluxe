// @ts-check
import { Rectangle2D$new } from './render';

/**
 * @typedef {import("./render").Render} Render
 */

const Player = {
    isGrounded: false,

    physics: undefined,

    /** @type Render[] */
    // @ts-ignore
    renders: undefined,
};

export function Player$render(p, ctx) {
    ctx.save();
    //PhysicsBody$transform(p.physics, ctx);
    for (const render of p.renders) render.render(ctx);
    ctx.restore();
};

export function Player$update(p, dt) {
    //PhysicsBody$update(p.physics, dt);
};

export const Player$new = (params = {}) =>
    Object.setPrototypeOf({
        renders: [Rectangle2D$new()],
        ...params,
    }, Player);
