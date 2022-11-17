import NES from './nes';
import buildUI from './ui';

const nes = new NES();
Object.assign(window, { nes });

nes.cheat = false;

window.addEventListener('keydown', (e) => {
    if (e.key == ' ') {
        nes.cheat = true;
    }
});

buildUI(nes);

import * as ADDR from './ram-addr';
window.ADDR = ADDR;

const frameCount = document.querySelector('.frameCount') as HTMLSpanElement;
const epoch = performance.now();
let framesDone = 0;
const loop = () => {
    requestAnimationFrame(loop);

    const diff = performance.now() - epoch;
    const frames = diff * nes.framerate | 0;
    const frameAmount = frames - framesDone;
    frameCount.textContent = String(frameAmount);

    if (nes.running && document.visibilityState !== 'hidden') {
        if (frameAmount > 5) {
            nes.frame(true);
        } else {
            for (let i = 0; i < frameAmount; i++) {
                nes.frame(i === frameAmount - 1);
            }
        }
    }

    framesDone = frames;
};
loop();
