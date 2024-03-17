// @ts-check
/** @type string[] */
const keys = [];

/**
 * keydown
 * @param {KeyboardEvent} e
 */
function keydown(e) {
    if (keys.indexOf(e.key) !== -1) return;
    keys.push(e.key);
}

/**
 * keyup
 * @param {KeyboardEvent} e
 */
function keyup(e) {
    let index = keys.indexOf(e.key);
    while (index !== -1) {
        keys.splice(index, 1);
        index = keys.indexOf(e.key);
    }
}

export function listenKeys() {
    document.addEventListener("keydown", keydown);
    document.addEventListener("keyup", keyup);
}

export function stopKeys() {
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("keyup", keyup);
}

/**
 * getKey
 * @param {string} key
 * @returns {boolean}
 */
export const getKey = key => keys.indexOf(key) !== -1;
