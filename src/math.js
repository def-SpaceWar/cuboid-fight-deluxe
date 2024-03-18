// @ts-check
import { make } from "./util";

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
 * makeVector
 * @param {number=} x
 * @param {number=} y
 * @returns {Vector}
 */
export const makeVector = (x = 0, y = 0) =>
    make(Vector, { data: new Float32Array([x, y]) });

/**
 * cloneVector
 * @param {VectorLike} v
 * @returns {Vector}
 */
export const cloneVector = v => makeVector(v.x, v.y);

/**
 * orthogonalVector
 * @param {VectorLike} v
 * @returns {Vector}
 */
export const orthogonalVector = v => makeVector(-v.y, v.x);

/**
 * normalizeVector
 * @param {VectorLike} v
 * @returns {Vector}
 */
export const normalizeVector = v => scaleVector(v, 1 / magnitudeOfVector(v));

/**
 * magnitudeSquaredOfVector
 * @param {VectorLike} v
 * @returns {number}
 */
export const magnitudeSquaredOfVector = v => v.x ** 2 + v.y ** 2;

/**
 * magnitudeOfVector
 * @param {VectorLike} v
 * @returns {number}
 */
export const magnitudeOfVector = v => Math.sqrt(magnitudeSquaredOfVector(v));

/**
 * isVectorNearZero
 * @param {VectorLike} v
 * @returns {boolean}
 */
export const isVectorNearZero = v => magnitudeSquaredOfVector(v) < 1;

/**
 * addVectors
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {Vector}
 */
export const addVectors = (v1, v2) =>
    makeVector(v1.x + v2.x, v1.y + v2.y);

/**
 * subtractVectors
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {Vector}
 */
export const subtractVectors = (v1, v2) =>
    makeVector(v1.x - v2.x, v1.y - v2.y);

/**
 * rotateVector
 * @param {VectorLike} v
 * @param {number} angle
 * @returns {Vector}
 */
export const rotateVector = (v, angle) =>
    makeVector(
        v.x * Math.cos(angle) - v.y * Math.sin(angle),
        v.y * Math.cos(angle) + v.x * Math.sin(angle),
    );

/**
 * scaleVector
 * @param {VectorLike} v
 * @param {number} s
 * @returns {Vector}
 */
export const scaleVector = (v, s) => makeVector(v.x * s, v.y * s);

/**
 * dotProduct
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const dotProduct = (v1, v2) => v1.x * v2.x + v1.y * v2.y;

/**
 * crossProduct
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const crossProduct = (v1, v2) => v1.x * v2.y - v1.y * v2.x;

/**
 * distanceSquaredBetweenVectors
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const distanceSquaredBetweenVectors = (v1, v2) =>
    (v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2;

/**
 * distanceBetweenVectors
 * @param {VectorLike} v1
 * @param {VectorLike} v2
 * @returns {number}
 */
export const distanceBetweenVectors = (v1, v2) =>
    Math.sqrt(distanceSquaredBetweenVectors(v1, v2));
