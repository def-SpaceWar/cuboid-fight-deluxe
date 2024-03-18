// @ts-check

/**
 * make
 * @template T
 * @param {T} prototype
 * @param {{ [K in keyof T]?: T[K] }} params
 * @returns T
 */
export const make = (prototype, params = {}) =>
	// @ts-ignore
    Object.setPrototypeOf(params, prototype);
