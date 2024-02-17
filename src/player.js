import { BasicPhysics$new } from './physics';
import { Rectangle2D$new } from './render';

const Player = {
    isGrounded: false,
};

Player.render = function(ctx) {
    ctx.save();
    this.physics.transform(ctx);
    for (const render of this.renders) render.render(ctx);
    ctx.restore();
};

Player.update = function(dt) { this.physics.update(dt); };

export const Player$new = (params = {}) =>
    Object.setPrototypeOf({
        physics: BasicPhysics$new(),
        renders: [Rectangle2D$new()],
        ...params
    }, Player);
