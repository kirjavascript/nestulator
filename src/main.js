"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tetris_nes_1 = __importDefault(require("../tetris.nes"));
const nes_1 = __importStar(require("./nes"));
const render_1 = require("./render");
const nes = new nes_1.default(tetris_nes_1.default);
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
const baseCycles = nes.region === nes_1.Region.PAL ? 33247 : 29780;
function frame(shouldRender) {
    const totalCycles = baseCycles + (nes.bus.frames & 1);
    nes.bus.nmiChecked = false;
    nes.bus.vblank = false;
    for (let i = 0; i < totalCycles - nmiCycles; i++) {
        nes.cpu.cycle();
        // if waiting for NMI, skip to it
        // @ts-ignore
        if (nes.bus.nmiChecked === true)
            break;
    }
    if (shouldRender) {
        render_1.renderSprites(nes);
        render_1.renderBG(nes);
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
// TODO: check if NO frames have to be rendered
// get mecex to check
const frameRate = nes.region === nes_1.Region.PAL ? 0.0500069 : 0.0600988;
const epoch = performance.now();
let framesDone = 0;
const loop = () => {
    requestAnimationFrame(loop);
    const diff = performance.now() - epoch;
    const frames = diff * frameRate | 0;
    const extraFrames = frames - framesDone;
    if (document.visibilityState === 'hidden') {
        framesDone = frames;
    }
    else if (extraFrames > 10) {
        frame(true);
        framesDone = frames;
    }
    else {
        if (extraFrames > 0) {
            for (let i = 0; i < extraFrames; i++) {
                frame(false);
                framesDone++;
            }
        }
        frame(true);
        framesDone++;
    }
    nes.RAM[0xc3] = 0; // skip legal
};
loop();
