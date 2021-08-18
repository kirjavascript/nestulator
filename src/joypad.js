"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controls = new Set([]);
window.addEventListener('blur', () => { controls.clear(); });
window.addEventListener('focus', () => { controls.clear(); });
const keymap = {};
[
    ['x', 'X', 'm', 'M'],
    ['z', 'Z', 'n', 'N'],
    ['Shift', 'c', 'C'],
    ['Enter', 'v', 'V'],
    ['ArrowUp', 'w', 'W'],
    ['ArrowDown', 's', 'S'],
    ['ArrowLeft', 'a', 'A'],
    ['ArrowRight', 'd', 'D'], // R
].forEach((keys, index) => {
    keys.forEach(key => { keymap[key] = index; });
});
const html = document.documentElement;
html.addEventListener('keydown', e => {
    if (e.key in keymap) {
        controls.add(keymap[e.key]);
        e.preventDefault();
    }
});
html.addEventListener('keyup', e => {
    if (e.key in keymap) {
        controls.delete(keymap[e.key]);
        e.preventDefault();
    }
});
function buttonIsDown(index) {
    return controls.has(index);
}
exports.default = buttonIsDown;
