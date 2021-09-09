import NES from './nes';
import buildUI from './ui';

// TODO: anticheat: https://www.youtube.com/watch?v=mwTzNwp4tHY
// TODO: recording (per game) / playback
// perf ideas: (tile caching, nametable write directly to UI, reduced cpu)
// https://web.archive.org/web/20210714180839/http://snk.digibase.ca/tetrisroms/NTSC.nes

const nes = new NES();
window.nes = nes;

buildUI(nes);

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
