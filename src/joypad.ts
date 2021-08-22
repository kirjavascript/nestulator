const controls: Set<number> = new Set([]);

window.addEventListener('blur', () => { controls.clear(); });
window.addEventListener('focus', () => { controls.clear(); });

const keymap: {[key: string] : number} = {};

[
    ['x', 'X', 'm', 'M'], // A
    ['z', 'Z', 'n', 'N'], // B
    ['Shift', 'c', 'C'], // select
    ['Enter', 'v', 'V'], // start
    ['ArrowUp', 'w', 'W', 'i', 'I'], // U
    ['ArrowDown', 's', 'S', 'k', 'K'], // D
    ['ArrowLeft', 'a', 'A', 'j', 'J'], // L
    ['ArrowRight', 'd', 'D', 'l', 'L'], // R
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

export default function buttonIsDown(index: number) {
    return controls.has(index);
}
