import { PhysicsBody$new, PolygonCollider$new } from './physics';
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
        physics: PhysicsBody$new({
            colliders: [PolygonCollider$new({
                points: [
                    { x: -50, y: -50 },
                    { x: -50, y: 50 },
                    { x: 50, y: 50 },
                    { x: 50, y: -50 },
                ],
            })],
        }),
        renders: [Rectangle2D$new()],
        ...params,
    }, Player);
