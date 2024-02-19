// Physics Bodies -------------------------------------------------------------
const PhysicsBody = {
    pos: {
        x: 0,
        y: 0,
    },
    vel: {
        x: 0,
        y: 0,
    },
    rotation: 0,
    angVel: 0,
    gravity: 500,

    drag: Math.log(1.1),
    elasticity: .1,
    staticFriction: .4,
    kineticFriction: .2,

    colliders: [],
    mass: 1,
    inertia: 0,

    calculateInertia() {
        this.inertia = 0;
        for (const collider of this.colliders) {
            const points = collider.points,
                N = points.length;

            let numerator = 0,
                denominator = 0;

            for (let n = 1; n <= N; n++) {
                numerator += Vector$cross(points[(n + 1) % N], points[n % N]) *
                    (
                        Vector$dot(points[n % N], points[n % N]) +
                        Vector$dot(points[n % N], points[(n + 1) % N]) +
                        Vector$dot(points[(n + 1) % N], points[(n + 1) % N])
                    );

                denominator += 6 *
                    Vector$cross(points[(n + 1) % N], points[n % N]);
            }

            this.inertia += numerator / denominator;
        }
        this.inertia /= this.colliders.length;

        return this;
    },
};

PhysicsBody.transform = function(ctx) {
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);
};

PhysicsBody.update = function(dt) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.vel.y += this.gravity * dt;
    this.rotation += this.angVel * dt;
    const dragConst = Math.exp(-dt * this.drag);
    this.vel.x *= dragConst;
    this.vel.y *= dragConst;
    this.angVel *= dragConst;
};

export const PhysicsBody$new = (params = {}) =>
    Object.setPrototypeOf(params, PhysicsBody).calculateInertia();

export function PhysicsBody$resolveCollision(pb1, pb2) {
    let collisionInfo, c1, c2;
    main: for (const _c1 of pb1.colliders) {
        for (const _c2 of pb2.colliders) {
            collisionInfo = areColliding(
                _c1, pb1.pos, pb1.rotation,
                _c2, pb2.pos, pb2.rotation
            );
            if (!collisionInfo[0]) continue;
            c1 = _c1;
            c2 = _c2;
            break main;
        }
    }

    if (!collisionInfo[0]) return;

    {
        if (pb2.mass === Infinity) {
            pb1.pos = Vector$add(
                Vector$scale(
                    collisionInfo.axis,
                    collisionInfo.overlap,
                ),
                pb1.pos,
            );
        } else if (pb1.mass == Infinity) {
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

        angVel1 = Vector$scale(Vector$normal(collisionArm1), pb1.angVel),
        angVel2 = Vector$scale(Vector$normal(collisionArm2), pb2.angVel),
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
        pb1.angVel += modAng1 / inertia1;

        const
            mod2 = -j / pb2.mass,
            modAng2 = -Vector$cross(collisionArm2, collisionInfo.axis) * j;

        pb2.vel.x += collisionInfo.axis.x * mod2;
        pb2.vel.y += collisionInfo.axis.y * mod2;
        pb2.angVel += modAng2 / inertia2;
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
    pb1.angVel += Vector$cross(collisionArm1, frictionImpulse) / inertia1;

    const mod2 = -1 / pb2.mass;
    pb2.vel.x += frictionImpulse.x * mod2;
    pb2.vel.y += frictionImpulse.y * mod2;
    pb1.angVel -= Vector$cross(collisionArm2, frictionImpulse) / inertia2;
}

// Colliders ------------------------------------------------------------------
const PolygonCollider = {
    type: "polygon",
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
        return this;
    },
};

PolygonCollider.getAxes = function*(rotation) {
    const newPoints = this.points.map(p => Vector$rotate(p, rotation)),
        newPointsLength = newPoints.length;
    for (let i = 0; i < newPointsLength; i++)
        yield Vector$normal(
            Vector$normalize(
                Vector$subtract(
                    newPoints[i],
                    newPoints[(i + 1) % newPointsLength],
                ),
            ),
        );
};

PolygonCollider.getLines = function*(pos, rotation) {
    const newPoints = this.points.map(p => Vector$add(
        Vector$rotate(p, rotation),
        pos,
    )),
        newPointsLength = newPoints.length;
    for (let i = 0; i < newPointsLength; i++)
        yield [newPoints[i], newPoints[(i + 1) % newPointsLength]];
};

PolygonCollider.getPoints = function*(pos, rotation) {
    const newPoints = this.points.map(p => Vector$add(
        Vector$rotate(p, rotation),
        pos,
    )),
        newPointsLength = newPoints.length;
    for (let i = 0; i < newPointsLength; i++)
        yield newPoints[i];
};

PolygonCollider.project = function(pos, rotation, axis) {
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
};

export const PolygonCollider$new = (params = {}) =>
    Object.setPrototypeOf(params, PolygonCollider).calculateCenter();

const EllipticalCollider = {
    type: "ellipse",
    w: 100,
    h: 100,
    rotation: 0,
    points: [],
    center: { x: 0, y: 0 },

    calculatePoints() {
        this.points = [];
        for (let i = 0; i < 100; i++) {
            const angle = i * Math.PI / 50;
            this.points.push(
                Vector$add(
                    Vector$rotate(
                        Vector$new({
                            x: Math.cos(angle) * this.w / 2,
                            y: Math.sin(angle) * this.h / 2,
                        }),
                        this.rotation,
                    ),
                    this.center,
                ),
            );
        }
        return this;
    },
};

EllipticalCollider.getAxes = function*(rotation) {
    const newPoints = this.points.map(p => Vector$rotate(p, rotation)),
        newPointsLength = newPoints.length;
    for (let i = 0; i < newPointsLength; i++)
        yield Vector$normal(
            Vector$normalize(
                Vector$subtract(
                    newPoints[i],
                    newPoints[(i + 1) % newPointsLength],
                ),
            ),
        );
};

EllipticalCollider.getLines = function*(pos, rotation) {
    const newPoints = this.points.map(p => Vector$add(
        Vector$rotate(p, rotation),
        pos,
    )),
        newPointsLength = newPoints.length;
    for (let i = 0; i < newPointsLength; i++)
        yield [newPoints[i], newPoints[(i + 1) % newPointsLength]];
};

EllipticalCollider.getPoints = function*(pos, rotation) {
    const newPoints = this.points.map(p => Vector$add(
        Vector$rotate(p, rotation),
        pos,
    )),
        newPointsLength = newPoints.length;
    for (let i = 0; i < newPointsLength; i++)
        yield newPoints[i];
};

EllipticalCollider.project = function(pos, rotation, axis) {
    const projections = [
        Vector$dot(
            Vector$add(
                Vector$rotate(
                    Vector$add(
                        Vector$rotate(
                            Vector$new({ x: - this.w / 2 }),
                            this.rotation,
                        ),
                        this.center,
                    ),
                    rotation,
                ),
                pos,
            ),
            axis,
        ),
        Vector$dot(
            Vector$add(
                Vector$rotate(
                    Vector$add(
                        Vector$rotate(
                            Vector$new({ y: - this.h / 2 }),
                            this.rotation,
                        ),
                        this.center,
                    ),
                    rotation,
                ),
                pos,
            ),
            axis,
        ),
        Vector$dot(
            Vector$add(
                Vector$rotate(
                    Vector$add(
                        Vector$rotate(
                            Vector$new({ x: + this.w / 2 }),
                            this.rotation,
                        ),
                        this.center,
                    ),
                    rotation,
                ),
                pos,
            ),
            axis,
        ),
        Vector$dot(
            Vector$add(
                Vector$rotate(
                    Vector$add(
                        Vector$rotate(
                            Vector$new({ y: + this.h / 2 }),
                            this.rotation,
                        ),
                        this.center,
                    ),
                    rotation,
                ),
                pos,
            ),
            axis,
        ),
    ];
    return [Math.min(...projections), Math.max(...projections)];
};

export const EllipticalCollider$new = (params = {}) =>
    Object.setPrototypeOf(params, EllipticalCollider).calculatePoints();

function distanceFromPointToLineSquared(p, v, w) {
    const l2 = Vector$distanceSquared(v, w);
    if (l2 === 0) return Vector$distanceSquared(p, v);
    const t = Math.max(0, Math.min(1, Vector$dot(Vector$subtract(p, v), Vector$subtract(w, v)) / l2));
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
            if (distanceSq > smallestDistance) {
                continue;
            } else if (
                collisionPoint && Math.abs(distanceSq - smallestDistance) < 1
            ) {
                collisionPoint = Vector$scale(
                    Vector$add(collisionPoint, p),
                    .5,
                );
            } else {
                smallestDistance = distanceSq;
                collisionPoint = p;
            }
        }
    }

    for (const [a, b] of c2.getLines(pos2, rotation2)) {
        for (const p of c1.getPoints(pos1, rotation1)) {
            const distanceSq = distanceFromPointToLineSquared(p, a, b);
            if (distanceSq > smallestDistance) {
                continue;
            } else if (
                collisionPoint && Math.abs(distanceSq - smallestDistance) < 1
            ) {
                collisionPoint = Vector$scale(
                    Vector$add(collisionPoint, p),
                    .5,
                );
            } else {
                smallestDistance = distanceSq;
                collisionPoint = p;
            }
        }
    }

    return {
        0: true,
        axis: bestAxis,
        overlap: separationDistance,
        collisionPoint,
    };
}

// Vector Math ----------------------------------------------------------------
const Vector = {
    x: 0,
    y: 0,
};

export const Vector$new = (params = {}) =>
    Object.setPrototypeOf(params, Vector);
export const Vector$clone = v => Vector$new({ x: v.x, y: v.y });

export const Vector$up = () => Vector$new({ y: -1 });
export const Vector$down = () => Vector$new({ y: 1 });
export const Vector$left = () => Vector$new({ x: -1 });
export const Vector$right = () => Vector$new({ x: 1 });

export const Vector$add = (v1, v2) =>
    Vector$new({ x: v1.x + v2.x, y: v1.y + v2.y });
export const Vector$subtract = (v1, v2) =>
    Vector$new({ x: v1.x - v2.x, y: v1.y - v2.y });
export const Vector$rotate = (v, angle) => Vector$new({
    x: v.x * Math.cos(angle) - v.y * Math.sin(angle),
    y: v.y * Math.cos(angle) + v.x * Math.sin(angle),
});
export const Vector$scale = (v, s) => Vector$new({ x: v.x * s, y: v.y * s });

export const Vector$dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y;
export const Vector$cross = (v1, v2) => v1.x * v2.y - v1.y * v2.x;

export const Vector$magnitudeSquared = v => v.x ** 2 + v.y ** 2;
export const Vector$magnitude = v => Math.sqrt(Vector$magnitudeSquared(v));
export const Vector$nearZero = v => Vector$magnitudeSquared(v) < 0.01;

export const Vector$distanceSquared = (v1, v2) =>
    (v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2;
export const Vector$distance = (v1, v2) =>
    Math.sqrt(Vector$distanceSquared(v1, v2));

export const Vector$normal = v => Vector$new({ x: -v.y, y: v.x });
export const Vector$normalize = v => Vector$scale(v, 1 / Vector$magnitude(v));
