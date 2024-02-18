import { BasicPhysicsBody$new } from './physics';
import { Rectangle2D$new } from './render';

const Player = {
    isGrounded: false,
    renders: [],
};

Player.render = function(ctx) {
    ctx.save();
    this.physics.transform(ctx);
    for (const render of this.renders) render.render(ctx);
    ctx.restore();
};

Player.update = function(dt) { this.physics.update(dt); };

export const Player$Default = (params = {}) =>
    Object.setPrototypeOf({
        physics: BasicPhysicsBody$new(),
        renders: [Rectangle2D$new()],
        ...params,
    }, Player);
