import { BasicPhysics$New } from './physics';
import { Rectangle2D$New } from './render';

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

export const Player$New = (params = {}) =>
    Object.setPrototypeOf({
        physics: BasicPhysics$New(),
        renders: [Rectangle2D$New()],
        ...params
    }, Player);
