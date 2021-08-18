import tetrisROM from '../tetris.nes';
import NES, { Region } from './nes';
import { renderBG, renderSprites } from './render';

const nes = new NES(tetrisROM);


// TODO: timing
// TODO: blocktool demo
// TODO: audio
// TODO: localstorage / drag
// TODO: demo
//
// TODO: runahead
// TODO: timestamps, security via obscurity

// SOCD / runahead discussion
// https://discord.com/channels/374368504465457153/577489649493213185/877303108626178078
//
//https://emudev.de/nes-emulator/about-mappers-mmc1-and-mmc3/
//https://bugzmanov.github.io/nes_ebook/chapter_6_1.html
//https://github.com/binji/binjgb/blob/a4433d9aa7fa6e04e7d3c5ba7d27fb13e653bcae/docs/demo.js#L462
// LOOP

const nmiCycles = 2273;
const baseCycles = nes.region === Region.PAL ? 33247 : 29780;

function frame(shouldRender: boolean) {
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
        renderBG(nes);
    }

    if (nes.bus.nmiEnabled) {
        nes.cpu.nmi();
        nes.bus.vblank = true;
    }

    for (let i = 0; i < nmiCycles; i++) {
        nes.cpu.cycle();
        // TODO: potentially break here
    }

    nes.bus.frames++;
}

const frameCount = document.body.insertBefore(document.createElement('div'), document.body.firstElementChild);


// get mecex to check
const frameRate = nes.region === Region.PAL ? 0.0500069 : 0.0600988;
const epoch = performance.now();
let framesDone = 0;
const loop = () => {
    requestAnimationFrame(loop);

    const diff = performance.now() - epoch;
    const frames = diff * frameRate | 0;
    const frameAmount = frames - framesDone;
    frameCount.textContent = String(frameAmount);

    if (document.visibilityState !== 'hidden') {
        if (frameAmount > 5) {
            frame(true);
        } else {
            for (let i = 0; i < frameAmount; i++) {
                frame(i === frameAmount - 1);
            }
        }
    }
    nes.RAM[0xc3] = 0; // skip legal
    framesDone = frames;
};
loop();
