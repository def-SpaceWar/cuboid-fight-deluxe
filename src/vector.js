// @ts-check
/**
 * Vector Math ----------------------------------------------------------------
 * @typedef {{ x: number, y: number }} VectorLike
 * @typedef {typeof Vector} Vector
 */

const Vector = {
    /** @type Float32Array */
    // @ts-ignore
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
export const Vector$nearZero = v => Vector$magnitudeSquared(v) < 1;

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
