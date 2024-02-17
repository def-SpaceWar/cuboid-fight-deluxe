const keys = [];

function keydown(e) {
    if (keys.indexOf(e.key) !== -1) return;
    keys.push(e.key);
}

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

export function getKeys() { }
