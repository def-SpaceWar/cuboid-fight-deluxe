const PhysicsObject = {
    x: 0,
    y: 0,
    velX: 0,
    velY: 0,
    gravity: 500,
    drag: Math.log(1.1),
    mass: 1,
    colliders: []
};

PhysicsObject.update = function(dt) {
    this.x += this.velX * dt;
    this.y += this.velY * dt;
    this.velY += this.gravity * dt;
    const dragConst = Math.exp(-dt * this.drag);
    this.velX *= dragConst;
    this.velY *= dragConst;
};

export function PhysicsObject$New(params) {
    return Object.setPrototypeOf(params ? params : {}, PhysicsObject);
}

const RectangleRender = {
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    rotation: 0,
    color: "red",
};

RectangleRender.render = function(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
    ctx.restore();
};

export function RectangleRender$New(params) {
    return Object.setPrototypeOf(params ? params : {}, RectangleRender);
}

const Player = {
    isGrounded: false,
};

Player.render = function(ctx) {
    ctx.save();
    ctx.translate(this.physicsObject.x, this.physicsObject.y);
    for (const render of this.renders) render.render(ctx);
    ctx.restore();
};

Player.update = function(dt) {
    this.physicsObject.update(dt);
};

export function Player$New(params) {
    const defaults = {
        physicsObject: PhysicsObject$New(),
        renders: [RectangleRender$New()],
    }
    return Object.setPrototypeOf(
        params
            ? { ...defaults, ...params }
            : defaults,
        Player
    );
}
