const controls: Set<number> = new Set([]);

window.addEventListener('blur', controls.clear);
window.addEventListener('focus', controls.clear);

const keymap: { [key: string]: number } = {};

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
    keys.forEach((key) => {
        keymap[key] = index;
    });
});

const html = document.documentElement;

html.addEventListener('keydown', (e) => {
    if (e.key in keymap) {
        const index = keymap[e.key];
        // handle SOCD as second input priority for L/R
        if (index === 6) controls.delete(7);
        if (index === 7) controls.delete(6);
        controls.add(index);
        e.preventDefault();
    }
});
html.addEventListener('keyup', (e) => {
    if (e.key in keymap) {
        controls.delete(keymap[e.key]);
        e.preventDefault();
    }
});


const gamepads: { [index: number]: Gamepad } = {};

function gamepadHandler(event: GamepadEvent, connecting: boolean) {
    const gamepad = event.gamepad;
    if (connecting) {
        gamepads[gamepad.index] = gamepad;
    } else {
        delete gamepads[gamepad.index];
    }
}

// @ts-ignore
window.addEventListener(
    'gamepadconnected',
    (e: GamepadEvent) => {
        gamepadHandler(e, true);
    },
    false,
);
// @ts-ignore
window.addEventListener(
    'gamepaddisconnected',
    (e: GamepadEvent) => {
        gamepadHandler(e, false);
    },
    false,
);

export default function buttonIsDown(index: number) {
    if (gamepads[0]) {
        if (index < 4) {
            return gamepads[0].buttons[index].pressed;
        } else {
            if (index === 4) {
                return gamepads[0].axes[1] === -1;
            } else if (index === 5) {
                return gamepads[0].axes[1] === 1;
            } else if (index === 6) {
                return gamepads[0].axes[0] === -1;
            } else if (index === 7) {
                return gamepads[0].axes[0] === 1;
            }
        }
    }
    return controls.has(index);
}
