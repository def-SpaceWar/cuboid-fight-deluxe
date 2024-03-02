import { PhysicsBody$new, PhysicsBody$transform, PhysicsBody$update, PolygonCollider$new } from './physics';
import { Rectangle2D$new } from './render';

const Player = {
    isGrounded: false,
};

Player.render = function(ctx) {
    ctx.save();
    PhysicsBody$transform(this.physics, ctx);
    for (const render of this.renders) render.render(ctx);
    ctx.restore();
};

Player.update = function(dt) {
    PhysicsBody$update(this.physics, dt);
};

export const Player$Default = (params = {}, physicsParams = {}) =>
    Object.setPrototypeOf({
        physics: PhysicsBody$new({
            lockRotation: false,
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
