import tetrisROM from '../tetris.nes';
import { paletteHex, paletteRGB } from './colors';
import NES, { Region } from './nes';

const { region, bus, cpu, VRAM, RAM, CHR } = new NES(tetrisROM);


// fast and accurate (with hacks)
// foxNES/CTMulator

// TODO: timing
// TODO: audio
// TODO: localstorage / drag
// TODO: demo
//
// TODO: runahead
// TODO: timestamps, security via obscurity

// SOCD / runahead discussion
// https://discord.com/channels/374368504465457153/577489649493213185/877303108626178078

// RENDER

const screen = document.body.appendChild(document.createElement('div'));
screen.className = 'screen';

const background = screen.appendChild(document.createElement('canvas'));
background.width = 256;
background.height = 240;
const ctx = background.getContext('2d') as CanvasRenderingContext2D;

const paletteDebug = document.body.appendChild(document.createElement('div'));
paletteDebug.style.display = 'flex';

function renderBG() {
    if (!bus.backgroundDirty) return;
    bus.backgroundDirty = false;
    if (!bus.backgroundDisplay) {
        ctx.clearRect(0, 0, background.width, background.height);
        return;
    }

    const palettes = [
        VRAM.slice(0x3f00, 0x3f04),
        VRAM.slice(0x3f04, 0x3f08),
        VRAM.slice(0x3f08, 0x3f0c),
        VRAM.slice(0x3f0c, 0x3f10),
    ];

    background.style.backgroundColor = paletteHex[palettes[0][0]];

    paletteDebug.innerHTML = '';
    palettes
        .map((d) => Array.from(d))
        .flat()
        .forEach((color) => {
            const box = document.createElement('div');
            box.textContent = color.toString(16);
            box.style.backgroundColor = paletteHex[color];
            paletteDebug.appendChild(box);
        });

    let cursor = 0;
    for (let y = 0; y < background.height / 8; y++) {
        for (let x = 0; x < background.width / 8; x++) {
            const tile = VRAM[0x2000 + cursor++];

            const attrIndex =
                Math.floor(x / 4) + (Math.floor(y / 4) * 8) + 0x23c0;
            const attr = VRAM[attrIndex];
            const shift = ((x/2 & 1) * 2) + ((y/2 & 1) * 4);
            const paletteLine = (attr >> shift) & 0b11;
            const palette = palettes[paletteLine];

            const chrOff = (tile * 0x10) + (bus.chr0 * 0x1000);
            const chrData = CHR.slice(chrOff, chrOff + 0x10);

            // TODO: cache this stuff
            const pixels = [];
            for (let i = 0; i < 8; i++) {
                const high = chrData[i].toString(2).padStart(8, '0');
                const low = chrData[i + 8].toString(2).padStart(8, '0');
                for (let j = 0; j < 8; j++) {
                    pixels.push(parseInt(low[j] + high[j], 2));
                }
            }
            const imageData = ctx.createImageData(8, 8);

            const greyscale = false;

            pixels.forEach((pixel, i) => {
                if (pixel !== 0) { // can ignore transparent pixels
                    if (greyscale) {
                        imageData.data[i * 4 + 0] = 85 * pixel;
                        imageData.data[i * 4 + 1] = 85 * pixel;
                        imageData.data[i * 4 + 2] = 85 * pixel;
                    } else {
                        const [r, g, b] = paletteRGB[palette[pixel]];
                        imageData.data[i * 4 + 0] = r;
                        imageData.data[i * 4 + 1] = g;
                        imageData.data[i * 4 + 2] = b;
                    }
                    imageData.data[i * 4 + 3] = 255;
                }
            });

            ctx.putImageData(imageData, x * 8, y * 8);

            // ctx.fillStyle = 'white';
            // ctx.font = '10px Arial';
            // ctx.fillText(attr.toString(16), x*8, 8 + (y*8));
            // ctx.fillText(shift, x*8, 8 + y*8);
        }
    }
}

const sprites = screen.appendChild(document.createElement('canvas'));
sprites.width = 256;
sprites.height = 240;
const spCtx = sprites.getContext('2d') as CanvasRenderingContext2D;
sprites.style.backgroundColor = 'transparent';

function renderSprites() {
    spCtx.clearRect(0, 0, sprites.width, sprites.height);
    const oam = [...RAM.slice(0x200, 0x300)];
    const palettes = [
        VRAM.slice(0x3f10, 0x3f14),
        VRAM.slice(0x3f14, 0x3f18),
        VRAM.slice(0x3f18, 0x3f1c),
        VRAM.slice(0x3f1c, 0x3f20),
    ];

    while (oam.length) {
        const [y, tile, attr, x] = oam.splice(0, 4);
        // assume attributes like this are bad
        if (tile !== 0xFF && tile !== 0xEF && x !== 0 && attr !== 0xFF) {
            const palette = palettes[attr & 0b11];
            const vflip = Boolean(attr & 0b1000000);

            // TODO: dedupe
            const chrOff = (tile * 0x10) + (bus.chr0 * 0x1000);
            const chrData = CHR.slice(chrOff, chrOff + 0x10);

            const pixels = [];
            for (let i = 0; i < 8; i++) {
                const high = chrData[i].toString(2).padStart(8, '0');
                const low = chrData[i + 8].toString(2).padStart(8, '0');
                for (let j = 0; j < 8; j++) {
                    pixels.push(parseInt(low[j] + high[j], 2));
                }
            }
            const imageData = ctx.createImageData(8, 8);

            const greyscale = false;

            const pixelList = vflip ? pixels.reverse() : pixels;

            pixelList.forEach((pixel, i) => {
                if (pixel !== 0) { // can ignore transparent pixels
                    if (greyscale) {
                        imageData.data[i * 4 + 0] = 85 * pixel;
                        imageData.data[i * 4 + 1] = 85 * pixel;
                        imageData.data[i * 4 + 2] = 85 * pixel;
                    } else {
                        const [r, g, b] = paletteRGB[palette[pixel]];
                        imageData.data[i * 4 + 0] = r;
                        imageData.data[i * 4 + 1] = g;
                        imageData.data[i * 4 + 2] = b;
                    }
                    imageData.data[i * 4 + 3] = 255;
                }
            });

            const yOffset = vflip ? y : y + 1;

            spCtx.putImageData(imageData, x, yOffset);
        }
    }
}

// DEBUG

const debug = document.body.appendChild(document.createElement('pre'));

function debugRAM() {
    const lines = [];
    const d = [...RAM];
    for (let cursor = 0; d.length; cursor += 16) {
        lines.push(
            `0x${cursor.toString(16).padStart(4, '0')}: ` +
                d
                    .splice(0, 16)
                    .map((d) => d.toString(16).padStart(2, '0'))
                    .join(','),
        );
    }
    debug.innerHTML = `PC: ${cpu.state.p.toString(16)}\nframes: ${
        bus.frames
    }\n${lines.join('\n')}`;
}

// LOOP

const nmiCycles = 2273;
const baseCycles = region === Region.PAL ? 33247 : 29780;

function frame(shouldRender: boolean) {
    const totalCycles = 29780 + (bus.frames & 1);

    bus.vblank = false;

    for (let i = 0; i < totalCycles - nmiCycles; i++) {
        if (cpu.executionState === 1) {
            // console.log([Number(cpu.state.p).toString(16),  disasm.disassembleAt(cpu.state.p)]);
        }
        cpu.cycle();
        // optimization if (checkForNMI) break
        // TODO: instead of running x number, of cycles, skip from the rom to vblank
    }

    if (bus.nmiEnabled) {
        cpu.nmi();
        bus.vblank = true;
    }

    shouldRender && renderSprites(); // TODO: cache

    for (let i = 0; i < nmiCycles; i++) {
        if (cpu.executionState === 1) {
            // console.log([Number(cpu.state.p).toString(16),  disasm.disassembleAt(cpu.state.p)]);
        }

        cpu.cycle();
        // if no nmi, break
    }

    shouldRender && renderBG();

    debugRAM();

    if (++bus.frames > 10) {
        // stop = true;
    }
}
let stop = false;

// TODO: fix performance issues when tabbing away
const frameRate = region === Region.PAL ? 0.0500069 : 0.0600988;
const epoch = performance.now();
const loop = () => {
    !stop && requestAnimationFrame(loop);
    const diff = performance.now() - epoch;
    const frames = diff * frameRate | 0;
    if (frames > bus.frames) {
        for (let i = 0; i < frames - bus.frames; i++) {
            frame(false);
        }
    }
    frame(true);
};

loop();
