const controls: Set<number> = new Set([]);

window.addEventListener('blur', () => controls.clear());
window.addEventListener('focus', () => controls.clear());

// reassigned in remaps()
let keymap: { [key: string]: number } = {};
// let padmap: { [
let hasGamepad = false;

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

// keyboard

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

// gamepad

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

// remapping

// UDLRBASS for input
// ABSSUDLR for output

const buttonNames = [
    'Up',
    'Down',
    'Left',
    'Right',
    'B',
    'A',
    'Select',
    'Start',
];
const pinLookup = [4, 5, 6, 7, 1, 0, 2, 3];

export function remap({
    setText,
    onComplete,
}: {
    setText: (text: string) => void;
    onComplete: () => void;
}) {
    const keyRemaps: { [name: string]: number } = {};
    const padRemaps: {
        buttons: { [mapIndex: number]: [number, number] };
        axes: { [mapIndex: number]: [number, number, number] };
    } = { buttons: {}, axes: {} };

    let mapIndex = 0;
    const keydown = (e: KeyboardEvent) => {
        if (!(e.key in keyRemaps)) {
            keyRemaps[e.key] = pinLookup[mapIndex];
            addedMap();
        }
    };

    html.addEventListener('keydown', keydown);

    const interval = setInterval(() => {
        // poll for gamepad presses
        for (let i = 0; i < gamepads.length; i++) {
            const gamepad = gamepads[i];
            const pressed = gamepad.buttons.findIndex((d) => d.pressed);
            if (pressed !== -1) {
                const alreadyPressed = Object.values(padRemaps.buttons).some(
                    ([_, alreadyPressed]) => alreadyPressed === pressed,
                );
                if (!alreadyPressed) {
                    padRemaps.buttons[mapIndex] = [i, pressed];
                    addedMap();
                    break;
                }
            }
            const axes = gamepad.axes.findIndex((d) => Math.abs(d) > 0.5);
            if (axes !== -1) {
                const alreadyTilted = Object.values(padRemaps.axes).some(
                    ([_, alreadyTilted]) => alreadyTilted === axes,
                );
                if (!alreadyTilted) {
                    padRemaps.axes[mapIndex] = [i, axes, gamepad.axes[axes]];
                    addedMap();
                    break;
                }
            }
        }
    }, 100);

    const showMessage = () => {
        setText(`Enter input for ${buttonNames[mapIndex]}`);
    };
    showMessage();

    const addedMap = () => {
        console.log(padRemaps);
        mapIndex++;
        if (mapIndex === 8) {
            html.removeEventListener('keydown', keydown);
            clearInterval(interval);

            keymap = keyRemaps;
            if (Object.keys(padRemaps)) {
                hasGamepad = true;
                // TODO: gamepad stuff
            } else {
                hasGamepad = false;
            }
            onComplete();
        } else {
            showMessage();
        }
    };
}
