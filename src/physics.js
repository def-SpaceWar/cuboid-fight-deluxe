const BasicPhysics = {
    x: 0,
    y: 0,
    velX: 0,
    velY: 0,
    gravity: 500,
    drag: Math.log(1.1),
    mass: 1,
    colliders: [],
};

BasicPhysics.transform = function(ctx) { ctx.translate(this.x, this.y); }

BasicPhysics.update = function(dt) {
    this.x += this.velX * dt;
    this.y += this.velY * dt;
    this.velY += this.gravity * dt;
    const dragConst = Math.exp(-dt * this.drag);
    this.velX *= dragConst;
    this.velY *= dragConst;
};

BasicPhysics.forceAtPoint = function(x, y) {};
BasicPhysics.collide = function(other) {};

export const BasicPhysics$New = (params = {}) =>
    Object.setPrototypeOf(params, BasicPhysics);

const ComplexPhysics = {}; // TODO

export const ComplexPhysics$New = (params = {}) =>
    Object.setPrototypeOf(params, BasicPhysics);
