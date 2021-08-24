import NES, { Region } from './nes';
import { renderBG, renderSprites } from './render';

const nes = new NES();

// nes.PRG[0x1A91] = 0; // AEPPOZ
nes.PRG[0x1C89] = 0xFA; // maxout
nes.PRG[0x180C] = 0x90; // fix colours
const noLegal = true;

/*
    to make an emulator with strong anti cheat, you need to first make an emulator that people want to actually use
    this emulator aims for good performance, with precise timing and gameplay mechanics for competitive play
    this is the first demo version. its a little rough around the edges. feedback would be great
    the codebase is simple, hackable and portable; there is a lot of scope for different types of project

*/

// TODO: localstorage / region / drag / try hacks
// TODO: audio
// TODO: controls / joystick api
// TODO: favicon
// TODO: demo
//
// perf: (tile caching, reduced cpu)

const baseCycles = nes.region === Region.PAL ? 33247 : 29780;
const nmiCycles = 2273;

function frame(shouldRender: boolean) {
    if (shouldRender && nes.runahead) {
        cpuFrame(false);
        const RAM = nes.RAM.slice(0);
        const VRAM = nes.VRAM.slice(0);
        const state = { ...nes.cpu.state };
        const cpu = { ...nes.cpu };
        const bus = { ...nes.bus };
        cpuFrame(true);
        // rollback
        nes.RAM = RAM;
        nes.VRAM = VRAM;
        Object.assign(nes.bus, bus);
        Object.assign(nes.cpu, cpu);
        Object.assign(nes.cpu.state, state);
        nes.bus.backgroundDirty = false;
    } else {
        cpuFrame(shouldRender);
    }
}

function cpuFrame(shouldRender: boolean){
    const totalCycles = baseCycles + (nes.bus.frames & 1);

    nes.bus.nmiChecked = false;
    nes.bus.vblank = false;

    for (let i = 0; i < totalCycles - nmiCycles; i++) {
        nes.cpu.cycle();
        // if waiting for NMI, skip to it
        // @ts-ignore
        if (nes.bus.nmiChecked === true) break;
    }

    if (shouldRender) {
        renderSprites(nes);
    }

    if (nes.bus.nmiEnabled) {
        nes.bus.vblank = true;
        nes.cpu.nmi();
    }

    const afterCycles = nes.RAM[0xC0] === 3
        ? 1300 // workaround for level select screen bug
        : nmiCycles;

    for (let i = 0; i < afterCycles; i++) {
        nes.cpu.cycle();
        // do nmi cycles... and some of the next frame
    }

    // unless we align executionState rollback doesn work
    while (nes.cpu.executionState !== 1) {
        nes.cpu.cycle();
    }

    // const sfx = nes.RAM[0x6F9];
    // sfx && console.log(['nothing', 'option', 'screen', 'shift', 'tetris', 'rotate', 'levelup', 'lock', 'chirp?', 'clear', 'complete'][nes.RAM[0x6F9]])

    if (shouldRender) {
        renderBG(nes);
    }

    nes.bus.frames++;
}

const runaheadBox = document.querySelector('#runahead') as HTMLInputElement;
runaheadBox.addEventListener('click', e => {
    nes.runahead = (e.target as HTMLInputElement).checked;
});
nes.runahead = runaheadBox.checked;

const frameCount = document.querySelector('.frameCount') as HTMLSpanElement;
const frameRate = nes.region === Region.PAL ? 0.0500069 : 0.0600988;
const epoch = performance.now();
let framesDone = 0;
const loop = () => {
    requestAnimationFrame(loop);

    const diff = performance.now() - epoch;
    const frames = diff * frameRate | 0;
    const frameAmount = frames - framesDone;
    frameCount.textContent = String(frameAmount);

    if (nes.running && document.visibilityState !== 'hidden') {
        if (frameAmount > 5) {
            frame(true);
        } else {
            for (let i = 0; i < frameAmount; i++) {
                frame(i === frameAmount - 1);
            }
        }
    }
    noLegal && (nes.RAM[0xc3] = 0); // skip legal
    framesDone = frames;
};
loop();
