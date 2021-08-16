const controls: Set<number> = new Set([]);

window.addEventListener('blur', () => { controls.clear(); });
window.addEventListener('focus', () => { controls.clear(); });

const keymap: {[key: string] : number} = {};

[
    ['x', 'X', '.', '>', ' '], // A
    ['z', 'Z', ',', '<'], // B
    ['Shift'], // select
    ['Enter'], // start
    ['ArrowUp', 'w', 'W'], // U
    ['ArrowDown', 's', 'S'], // D
    ['ArrowLeft', 'a', 'A'], // L
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

export default function buttonIsDown(index: number) {
    // console.log(index, controls.has(index))
    return controls.has(index);
}
