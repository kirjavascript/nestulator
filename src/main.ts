import NES from './nes';
import buildUI from './ui';

/*
    to make an emulator with strong anti cheat, you need to first make an emulator that people want to actually use
    this emulator aims for good performance, with precise timing and gameplay mechanics for competitive play. the codebase is simple, hackable and embeddable
    this a rough first demo, feedback would be great
    nearly every ROM hack works, except tetrisgym (for now)
    next step is probably recording

    pros / cons

*/

// TODO: controls / joystick api
// TODO: blackscreen: gamemode -> lvl select | reset after game / remove hack
// TODO: lag when tab isn't visible for a long time
// TODO: demo
//
// TODO: .pal input
// TODO: recording (per game) / playback
// TODO: gnu's NSF AOT compiler
// TODO: seed find
// perf: (tile caching, nametable write directly to UI, reduced cpu)

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
