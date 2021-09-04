const controls: Set<number> = new Set([]);

window.addEventListener('blur', () => controls.clear());
window.addEventListener('focus', () => controls.clear());

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

export default function buttonIsDown(index: number) {
    return controls.has(index);
}

    // TODO: refactor
    // if (gamepads[0]) {
    //     if (index < 4) {
    //         return gamepads[0].buttons[index].pressed;
    //     } else {
    //         if (index === 4) {
    //             return gamepads[0].axes[1] === -1;
    //         } else if (index === 5) {
    //             return gamepads[0].axes[1] === 1;
    //         } else if (index === 6) {
    //             return gamepads[0].axes[0] === -1;
    //         } else if (index === 7) {
    //             return gamepads[0].axes[0] === 1;
    //         }
    //     }
    // }

const gamepads: Array<Gamepad> = [];

// @ts-ignore
window.addEventListener(
    'gamepadconnected',
    (event: GamepadEvent) => {
        const gamepad = event.gamepad;
        gamepads[gamepad.index] = gamepad;
    },
    false,
);
// @ts-ignore
window.addEventListener(
    'gamepaddisconnected',
    (event: GamepadEvent) => {
        const gamepad = event.gamepad;
        delete gamepads[gamepad.index];
    },
    false,
);

// UDLRBASS

function remap() {
    const keyMaps = {};
    const padMaps = {};
    let mapIndex = 0;
    const keydown = (e) => {
        console.log('down');
        // addMapping(e.key);
        keyMaps[mapIndex] = e.key;
        addedMap();
    };

    html.addEventListener('keydown', keydown);

    const interval = setInterval(() => {
        // poll for gamepad presses
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            const pressed = gamepad.buttons.findIndex(d => d.pressed);
            if (pressed !== -1) {
                console.log(pressed, i);
                padMaps[mapIndex] = [i, pressed];
                addedMap();
                break;
            }
            const axes = gamepad.axes.findIndex(d => Math.abs(d) > 0.5);
            if (axes !== -1) {
                padMaps[mapIndex] = [i, axes, gamepad.axes[axes]];
                addedMap();
                break;
            }
        }
    }, 100);

    const addedMap = () => {
        mapIndex++;
        if (mapIndex === 8) {
            console.log('dispose', mapping);
            html.removeEventListener('keydown', keydown);
            clearInterval(interval);
        }
    };

}


remap();
