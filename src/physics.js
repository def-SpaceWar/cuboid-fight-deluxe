/**
 * Physics Body ---------------------------------------------------------------
 * @typedef {typeof PhysicsBody} PhysicsBody
 */

const PhysicsBody = {
    /** @type Vector */
    pos: {
        x: 0,
        y: 0,
    },

    /** @type Vector */
    vel: {
        x: 0,
        y: 0,
    },

    lockRotation: false,
    rotation: 0,
    angVel: 0,
    gravity: 500,

    drag: Math.log(1.1),
    elasticity: .2,
    staticFriction: .4,
    kineticFriction: .2,

    /** @type Collider[] */
    colliders: [],
    mass: 1,
    inertia: 0,
};

export const PhysicsBody$new = (params = {}) =>
    PhysicsBody$calculateInertia(Object.setPrototypeOf(
        { pos: Vector$new(), vel: Vector$new(), ...params },
        PhysicsBody,
    ));

export function PhysicsBody$calculateInertia(p) {
    if (p.lockRotation) {
        p.inertia = Infinity;
        p.rotation = 0;
        p.angVel = 0;
        return p;
    }

    p.inertia = 0;
    for (const collider of p.colliders) {
        const points = collider.points,
            _N = points.length;

        let numerator = 0,
            denominator = 0;

        for (let n = 1; n <= _N; n++) {
            numerator += Vector$cross(points[(n + 1) % _N], points[n % _N]) *
                (
                    Vector$dot(points[n % _N], points[n % _N]) +
                    Vector$dot(points[n % _N], points[(n + 1) % _N]) +
                    Vector$dot(points[(n + 1) % _N], points[(n + 1) % _N])
                );

            denominator += 6 *
                Vector$cross(points[(n + 1) % _N], points[n % _N]);
        }

        p.inertia += numerator / denominator;
    }
    p.inertia /= p.colliders.length;

    return p;
};

export function PhysicsBody$transform(p, ctx) {
    ctx.translate(p.pos.x, p.pos.y);
    ctx.rotate(p.rotation);
};

export function PhysicsBody$update(p, dt) {
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.vel.y += p.gravity * dt;
    if (!p.lockRotation) p.rotation += p.angVel * dt;
    const dragConst = Math.exp(-dt * p.drag);
    p.vel.x *= dragConst;
    p.vel.y *= dragConst;
    if (!p.lockRotation) p.angVel *= dragConst;
};

let collisionEvents = [];

export function* getCollisionEvents() {
    for (const collisionEvent of collisionEvents) {
        yield collisionEvent;
    }
}

export function* clearCollisionEvents() {
    collisionEvents = [];
}

export function resolveCollision(pb1, pb2) {
    let collisionInfo;
    main: for (const c1 of pb1.colliders) {
        for (const c2 of pb2.colliders) {
            collisionInfo = areColliding(
                c1, pb1.pos, pb1.rotation,
                c2, pb2.pos, pb2.rotation
            );
            if (!collisionInfo[0]) continue;
            break main;
        }
    }
    if (!collisionInfo[0]) return;
    collisionEvents.push({
        primary: pb1,
        secondary: pb2,
        collisionInfo
    });

    {
        if (pb2.mass === Infinity) {
            pb1.pos = Vector$add(
                Vector$scale(
                    collisionInfo.axis,
                    collisionInfo.overlap,
                ),
                pb1.pos,
            );
        } else if (pb1.mass === Infinity) {
            pb2.pos = Vector$add(
                Vector$scale(
                    collisionInfo.axis,
                    -collisionInfo.overlap,
                ),
                pb2.pos,
            );
        } else {
            const total = pb1.mass + pb2.mass;
            pb1.pos = Vector$add(
                Vector$scale(
                    collisionInfo.axis,
                    collisionInfo.overlap * pb2.mass / total / 2,
                ),
                pb1.pos,
            );
            pb2.pos = Vector$add(
                Vector$scale(
                    collisionInfo.axis,
                    -collisionInfo.overlap * pb1.mass / total / 2,
                ),
                pb2.pos,
            );
        }
    }

    const
        relVel = Vector$subtract(pb1.vel, pb2.vel),
        jointMasses = 1 / pb1.mass + 1 / pb2.mass,

        collisionArm1 = Vector$subtract(
            collisionInfo.collisionPoint,
            pb1.pos,
        ),
        collisionArm2 = Vector$subtract(
            collisionInfo.collisionPoint,
            pb2.pos,
        ),

        inertia1 = pb1.inertia * pb1.mass,
        inertia2 = pb2.inertia * pb2.mass,

        angVel1 = Vector$scale(Vector$orthogonal(collisionArm1), pb1.angVel),
        angVel2 = Vector$scale(Vector$orthogonal(collisionArm2), pb2.angVel),
        relAngVel = Vector$subtract(angVel1, angVel2),

        totalRelVel = Vector$add(relVel, relAngVel),
        tangentVel = Vector$subtract(
            totalRelVel,
            Vector$scale(
                collisionInfo.axis,
                Vector$dot(totalRelVel, collisionInfo.axis),
            ),
        ),

        normalCrossedArm1 = Vector$cross(collisionInfo.axis, collisionArm1),
        normalCrossedArm2 = Vector$cross(collisionInfo.axis, collisionArm2),
        jointAngularVelocities =
            normalCrossedArm1 ** 2 / inertia1 +
            normalCrossedArm2 ** 2 / inertia2,

        elasticity = Math.min(pb1.elasticity, pb2.elasticity),
        j = -(1 + elasticity) *
            Vector$dot(Vector$add(relVel, relAngVel), collisionInfo.axis) /
            (jointMasses + jointAngularVelocities);

    {
        const
            mod1 = j / pb1.mass,
            modAng1 = Vector$cross(collisionArm1, collisionInfo.axis) * j;

        pb1.vel.x += collisionInfo.axis.x * mod1;
        pb1.vel.y += collisionInfo.axis.y * mod1;
        if (!pb1.lockRotation) pb1.angVel += modAng1 / inertia1;

        const
            mod2 = -j / pb2.mass,
            modAng2 = -Vector$cross(collisionArm2, collisionInfo.axis) * j;

        pb2.vel.x += collisionInfo.axis.x * mod2;
        pb2.vel.y += collisionInfo.axis.y * mod2;
        if (!pb2.lockRotation) pb2.angVel += modAng2 / inertia2;
    }

    if (Vector$nearZero(tangentVel)) return;

    const
        normalizedTangentVel = Vector$normalize(tangentVel),
        staticFriction = Math.sqrt(pb1.staticFriction * pb2.staticFriction),
        kineticFriction = Math.sqrt(pb1.kineticFriction * pb2.kineticFriction),
        jt = -Vector$dot(totalRelVel, tangentVel) /
            (jointMasses + jointAngularVelocities),
        frictionImpulse = (Math.abs(jt) <= j * staticFriction)
            ? Vector$scale(normalizedTangentVel, jt)
            : Vector$scale(normalizedTangentVel, -j * kineticFriction);

    const mod1 = 1 / pb1.mass;
    pb1.vel.x += frictionImpulse.x * mod1;
    pb1.vel.y += frictionImpulse.y * mod1;
    if (!pb1.lockRotation) pb1.angVel += Vector$cross(collisionArm1, frictionImpulse) / inertia1;

    const mod2 = -1 / pb2.mass;
    pb2.vel.x += frictionImpulse.x * mod2;
    pb2.vel.y += frictionImpulse.y * mod2;
    if (!pb2.lockRotation) pb2.angVel -= Vector$cross(collisionArm2, frictionImpulse) / inertia2;
}

/**
 * Colliders ------------------------------------------------------------------
 */

const PolygonCollider = {
    type: "polygon",
    points: [],

    getAxes: function*(rotation) {
        const newPoints = this.points.map(p => Vector$rotate(p, rotation)),
            newPointsLength = newPoints.length;
        for (let i = 0; i < newPointsLength; i++)
            yield Vector$orthogonal(
                Vector$normalize(
                    Vector$subtract(
                        newPoints[i],
                        newPoints[(i + 1) % newPointsLength],
                    ),
                ),
            );
    },

    getLines: function*(pos, rotation) {
        const newPoints = this.points.map(p => Vector$add(
            Vector$rotate(p, rotation),
            pos,
        )),
            newPointsLength = newPoints.length;
        for (let i = 0; i < newPointsLength; i++)
            yield [newPoints[i], newPoints[(i + 1) % newPointsLength]];
    },

    getPoints: function*(pos, rotation) {
        const newPoints = this.points.map(p => Vector$add(
            Vector$rotate(p, rotation),
            pos,
        )),
            newPointsLength = newPoints.length;
        for (let i = 0; i < newPointsLength; i++)
            yield newPoints[i];
    },

    project: function(pos, rotation, axis) {
        const projections = this.points.map(p => {
            const pPrime =
                Vector$add(
                    Vector$rotate(
                        p,
                        rotation,
                    ),
                    pos,
                );
            return Vector$dot(pPrime, axis);
        });
        return [Math.min(...projections), Math.max(...projections)];
    },
};

export const PolygonCollider$new = (params = {}) =>
    Object.setPrototypeOf(params, PolygonCollider);

const EllipticalCollider = {
    type: "ellipse",
    w: 20,
    h: 20,
    rotation: 0,
    points: [],
    center: { x: 0, y: 0 },

    getLines: function*(pos, rotation) {
        const newPoints = this.points.map(p => Vector$add(
            Vector$rotate(p, rotation),
            pos,
        )),
            newPointsLength = newPoints.length;
        for (let i = 0; i < newPointsLength; i++)
            yield [newPoints[i], newPoints[(i + 1) % newPointsLength]];
    },

    getAxes: function*(rotation) {
        const newPoints = this.points.map(p => Vector$rotate(p, rotation)),
            newPointsLength = newPoints.length / 2;
        for (let i = 0; i < newPointsLength; i++)
            yield Vector$orthogonal(
                Vector$normalize(
                    Vector$subtract(
                        newPoints[i],
                        newPoints[(i + 1) % newPointsLength],
                    ),
                ),
            );
    },

    getPoints: function*(pos, rotation) {
        const newPoints = this.points.map(p => Vector$add(
            Vector$rotate(p, rotation),
            pos,
        )),
            newPointsLength = newPoints.length;
        for (let i = 0; i < newPointsLength; i++)
            yield newPoints[i];
    },

    project: function(pos, rotation, axis) {
        const projections = this.points.map(p => {
            const pPrime =
                Vector$add(
                    Vector$rotate(
                        p,
                        rotation,
                    ),
                    pos,
                );
            return [Vector$dot(pPrime, axis)];
        });
        return [Math.min(...projections), Math.max(...projections)];
    },
};

export const EllipticalCollider$new = (params = {}) =>
    EllipticalCollider$calculatePoints(
        Object.setPrototypeOf(params, EllipticalCollider)
    );

export function EllipticalCollider$calculatePoints(c) {
    c.points = [];
    for (let i = 0; i < 50; i++) {
        const angle = i * Math.PI / 25;
        c.points.push(
            Vector$add(
                Vector$rotate(
                    Vector$new({
                        x: Math.cos(angle) * c.w / 2,
                        y: Math.sin(angle) * c.h / 2,
                    }),
                    c.rotation,
                ),
                c.center,
            ),
        );
    }
    return c;
}

function distanceFromPointToLineSquared(p, v, w) {
    const l2 = Vector$distanceSquared(v, w);
    if (l2 === 0) return Vector$distanceSquared(p, v);
    const t = Math.max(
        0,
        Math.min(
            1,
            Vector$dot(
                Vector$subtract(p, v),
                Vector$subtract(w, v),
            ) / l2,
        ),
    );
    return Vector$distanceSquared(
        p,
        Vector$add(v, Vector$scale(Vector$subtract(w, v), t)),
    );
}

export function areColliding(c1, pos1, rotation1, c2, pos2, rotation2) {
    let separationDistance = Infinity,
        bestAxis,
        bestLocation;

    for (const axis of c1.getAxes(rotation1)) {
        const [min1, max1] = c1.project(pos1, rotation1, axis);
        const [min2, max2] = c2.project(pos2, rotation2, axis);
        if (max1 <= min2 || min1 >= max2) return [false];

        if (max1 > min2) {
            const distance = min2 - max1;
            if (Math.abs(distance) < Math.abs(separationDistance)) {
                separationDistance = distance;
                bestAxis = axis;
                bestLocation = max1 + min2 / 2;
            }
        }

        if (max2 > min1) {
            const distance = max2 - min1;
            if (Math.abs(distance) < Math.abs(separationDistance)) {
                separationDistance = distance;
                bestAxis = axis;
                bestLocation = max2 + min1 / 2;
            }
        }
    }

    for (const axis of c2.getAxes(rotation2)) {
        const [min1, max1] = c1.project(pos1, rotation1, axis);
        const [min2, max2] = c2.project(pos2, rotation2, axis);
        if (max1 <= min2 || min1 >= max2) return [false];

        if (max1 > min2) {
            const distance = min2 - max1;
            if (Math.abs(distance) < Math.abs(separationDistance)) {
                separationDistance = distance;
                bestAxis = axis;
                bestLocation = max1 + min2 / 2;
            }
        }

        if (max2 > min1) {
            const distance = max2 - min1;
            if (Math.abs(distance) < Math.abs(separationDistance)) {
                separationDistance = distance;
                bestAxis = axis;
                bestLocation = max2 + min1 / 2;
            }
        }
    }

    let smallestDistance = Infinity,
        collisionPoint;

    for (const [a, b] of c1.getLines(pos1, rotation1)) {
        for (const p of c2.getPoints(pos2, rotation2)) {
            const distanceSq = distanceFromPointToLineSquared(p, a, b);
            if (distanceSq > smallestDistance) continue;

            if (
                collisionPoint && Math.abs(distanceSq - smallestDistance) < .1
            ) {
                collisionPoint = Vector$scale(
                    Vector$add(collisionPoint, p),
                    .5,
                );
                continue;
            }

            smallestDistance = distanceSq;
            collisionPoint = p;
        }
    }

    for (const [a, b] of c2.getLines(pos2, rotation2)) {
        for (const p of c1.getPoints(pos1, rotation1)) {
            const distanceSq = distanceFromPointToLineSquared(p, a, b);
            if (distanceSq > smallestDistance) continue;

            if (
                collisionPoint && Math.abs(distanceSq - smallestDistance) < .1
            ) {
                collisionPoint = Vector$scale(
                    Vector$add(collisionPoint, p),
                    .5,
                );
                continue;
            }

            smallestDistance = distanceSq;
            collisionPoint = p;
        }
    }

    return {
        0: true,
        axis: bestAxis,
        overlap: separationDistance,
        collisionPoint,
    };
}

/**
 * Vector Math ----------------------------------------------------------------
 * @typedef {{ x: number, y: number }} VectorLike
 * @typedef {typeof Vector} Vector
 */

const Vector = {
    /** @type Float32Array */
    data: undefined,
    get x() { return this.data[0]; },
    get y() { return this.data[1]; },
    set x(val) { this.data[0] = val; },
    set y(val) { this.data[1] = val; },
};

/**
 * Vector$new
 * @param {{ x?: number, y?: number }} params
 * @returns {Vector}
 */
export function Vector$new(params = {}) {
    const vec = Object.setPrototypeOf({ data: new Float32Array(2) }, Vector);
    vec.x = params.x || 0;
    vec.y = params.y || 0;
    return vec;
}

/**
 * Vector$clone
 * @param {VectorLike} v
 * @returns {Vector}
 */
export const Vector$clone = v => Vector$new({ x: v.x, y: v.y });

/**
 * Vector$orthogonal
 * @param {VectorLike} v
 * @returns {Vector}
 */
export const Vector$orthogonal = v => Vector$new({ x: -v.y, y: v.x });

/**
 * Vector$normalize
 * @param {VectorLike} v
 * @returns {Vector}
 */
export const Vector$normalize = v => Vector$scale(v, 1 / Vector$magnitude(v));

/**
 * Vector$magnitudeSquared
 * @param {VectorLike} v
 * @returns {number}
 */
export const Vector$magnitudeSquared = v => v.x ** 2 + v.y ** 2;

/**
 * Vector$magnitudeSquared
 * @param {VectorLike} v
 * @returns {number}
 */
export const Vector$magnitude = v => Math.sqrt(Vector$magnitudeSquared(v));

/**
 * Vector$nearZero
 * @param {VectorLike} v
 * @returns {boolean}
 */
export const Vector$nearZero = v => Vector$magnitudeSquared(v) < 0.01;

/**
 * Vector$add
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {Vector}
 */
export const Vector$add = (v1, v2) =>
    Vector$new({ x: v1.x + v2.x, y: v1.y + v2.y });

/**
 * Vector$subtract
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {Vector}
 */
export const Vector$subtract = (v1, v2) =>
    Vector$new({ x: v1.x - v2.x, y: v1.y - v2.y });

/**
 * Vector$rotate
 * @param {VectorLike} v
 * @param {number} angle
 * @returns {Vector}
 */
export const Vector$rotate = (v, angle) => Vector$new({
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.y * Math.cos(angle) + v.x * Math.sin(angle),
});

/**
 * Vector$scale
 * @param {VectorLike} v
 * @param {number} s
 * @returns {Vector}
 */
export const Vector$scale = (v, s) => Vector$new({ x: v.x * s, y: v.y * s });

/**
 * Vector$dot
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const Vector$dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

/**
 * Vector$cross
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const Vector$cross = (v1, v2) => v1.x * v2.y - v1.y * v2.x;

/**
 * Vector$distanceSquared
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const Vector$distanceSquared = (v1, v2) =>
    (v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2;

/**
 * Vector$distance
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const Vector$distance = (v1, v2) =>
    Math.sqrt(Vector$distanceSquared(v1, v2));
