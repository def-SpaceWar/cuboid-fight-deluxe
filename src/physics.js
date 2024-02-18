// Physics Bodies -------------------------------------------------------------
const BasicPhysicsBody = {
    x: 0,
    y: 0,
    velX: 0,
    velY: 0,
    gravity: 500,
    drag: Math.log(1.1),
    mass: 1,
    colliders: [],
};

BasicPhysicsBody.transform = function(ctx) { ctx.translate(this.x, this.y); };

BasicPhysicsBody.update = function(dt) {
    this.x += this.velX * dt;
    this.y += this.velY * dt;
    this.velY += this.gravity * dt;
    const dragConst = Math.exp(-dt * this.drag);
    this.velX *= dragConst;
    this.velY *= dragConst;
};

BasicPhysicsBody.forceAtPoint = function(p) { };

export const BasicPhysicsBody$new = (params = {}) =>
    Object.setPrototypeOf(params, BasicPhysicsBody);

//const ComplexPhysicsBody = {}; // TODO
//
//export const ComplexPhysicsBody$new = (params = {}) =>
//    Object.setPrototypeOf(params, BasicPhysicsBody);

export function resolveCollision(pb1, pb2) {
    // TODO: implementation
}

// Colliders ------------------------------------------------------------------
const PolygonCollider = {
    isRound: false,
    points: [],
    center: { x: 0, y: 0 },

    calculateCenter() {
        this.center = { x: 0, y: 0 };
        if (this.points.length === 0) return;
        this.points.forEach(p => {
            this.center.x += p.x;
            this.center.y += p.y;
        });
        this.center.x /= this.points.length;
        this.center.y /= this.points.length;
    },
};

PolygonCollider.getAxes = function(rotation) {
    // SAT theorom axes
};

PolygonCollider.project = function(x, y, rotation, axis) {
    // project on an axis
};

export const PolygonCollider$new = (params = {}) =>
    Object.setPrototypeOf(params, PolygonCollider);

const EllipticalCollider = {
    isRound: true,
    center: { x: 0, y: 0 },
    w: 100,
    h: 100,
    rotation: 0,
};

EllipticalCollider.getAxes = function(rotation) {
    // SAT theorom axes
};

EllipticalCollider.project = function(x, y, rotation, axis) {
    // project on an axis
};

export const EllipticalCollider$new = (params = {}) =>
    Object.setPrototypeOf(params, EllipticalCollider);

export function areColliding(c1, c2) {
    // TODO: implementation
}

// Vector Math ----------------------------------------------------------------
const Vector = {
    x: 0,
    y: 0,
};

export const Vector$new = (params = {}) =>
    Object.setPrototypeOf(params, Vector);

export const distanceSquared = (v1, v2) =>
    (v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2;
export const distance = (v1, v2) => Math.sqrt(distanceSquared(v1, v2));

export const magnitudeSquared = v => v.x ** 2 + v.y ** 2;
export const magnitude = v => Math.sqrt(magnitudeSquared(v));
