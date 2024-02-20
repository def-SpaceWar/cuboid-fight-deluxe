import { PhysicsBody$new, PolygonCollider$new, Vector$new } from "./physics";
import { Rectangle2D$new } from "./render";

const Platform = {
};

Platform.render = function(ctx) {
    ctx.save();
    this.physics.transform(ctx);
    for (const render of this.renders) render.render(ctx);
    ctx.restore();
};

export const Platform$new = (points) =>
    Object.setPrototypeOf({
        physics: PhysicsBody$new({
            pos: Vector$new({ y: 150 }),
            vel: Vector$new({ x: 0, y: 0 }),
            gravity: 0,
            angVel: 0,
            mass: Infinity,
            colliders: [PolygonCollider$new({
                points: points
                    ? points
                    : [
                        { x: -150, y: -5 },
                        { x: -150, y: 5 },
                        { x: 150, y: 5 },
                        { x: 150, y: -5 },
                    ],
            })],
        }),
        renders: [
            Rectangle2D$new({
                w: 300,
                h: 10,
                color: "#0f0",
            }),
        ],
    }, Platform);
