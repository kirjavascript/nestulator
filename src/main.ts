import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import Disassembler from '6502.ts/lib/machine/cpu/Disassembler';
import tetrisROM from '../tetris.nes';

import buttonIsDown from './joypad';

// fast and accurate (with hacks)
// foxNES/CTMulator

// TODO: sprite flipping
// TODO: PPUMASK for pause
// TODO: refactor everything
// TODO: audio
//
// TODO: runahead
// TODO: background and sprites on different canvases
// TODO: block tool
// TODO: timestamps, security via obscurity

// const PAL = false;
// const _header = tetrisROM.slice(0, 0x10);
const PRG = tetrisROM.slice(0x10, 0x8010);
const CHR = tetrisROM.slice(0x8010); // 2bpp, 16 per tile
const RAM = new Uint8Array(0x2000);
const VRAM = new Uint8Array(0x4000);
const colors = [ 0x7c7c7c, 0x0000fc, 0x0000bc, 0x4428bc, 0x940084, 0xa80020, 0xa81000, 0x881400, 0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000, 0xbcbcbc, 0x0078f8, 0x0058f8, 0x6844fc, 0xd800cc, 0xe40058, 0xf83800, 0xe45c10, 0xac7c00, 0x00b800, 0x00a800, 0x00a844, 0x008888, 0x000000, 0x000000, 0x000000, 0xf8f8f8, 0x3cbcfc, 0x6888fc, 0x9878f8, 0xf878f8, 0xf85898, 0xf87858, 0xfca044, 0xf8b800, 0xb8f818, 0x58d854, 0x58f898, 0x00e8d8, 0x787878, 0x000000, 0x000000, 0xfcfcfc, 0xa4e4fc, 0xb8b8f8, 0xd8b8f8, 0xf8b8f8, 0xf8a4c0, 0xf0d0b0, 0xfce0a8, 0xf8d878, 0xd8f878, 0xb8f8b8, 0xb8f8d8, 0x00fcfc, 0xf8d8f8, 0x000000, 0x000000 ];

class TetrisBus implements BusInterface {
    frames: number = 0;
    vblank: boolean = false;
    nmiEnabled: boolean = true;
    ppuAddr: number = 0;
    ppuAddrIndex: number = 0;
    chr0: number = 0;
    chr0Index: number = 0;
    joyIndex: number = 0;
    nametableDirty: boolean = false;
    read(address: number) {
        // vectors
        if (address === 0xfffa) return 0x05; // nmi
        if (address === 0xfffb) return 0x80;
        if (address === 0xfffc) return 0x0; // initRam
        if (address === 0xfffd) return 0x80;
        if (address === 0xfffe) return 0x4a; // irq
        if (address === 0xffff) return 0x80;

        // RAM
        if (address < 0x2000) {
            return RAM[address & 0x7ff];
        }
        // ROM
        if (address >= 0x8000) {
            return PRG[address - 0x8000];
        }

        if (address === 0x2002) {
            // PPUSTATUS
            return this.vblank ? 0x40 : 0;
        }

        if ((address >= 0x4000 && address <= 0x4015) || address === 0x4017) {
            // APU
            return;
        }

        if (address === 0x4016) {
            const isDown = buttonIsDown(this.joyIndex);
            this.joyIndex = (this.joyIndex + 1) % 8;
            return isDown;
        }

        if (address === 0x4017) return; // joypad2

        console.log(['last', Number(cpu.state.p).toString(16)]);
        console.error('read', address.toString(16));
        return 0;
    }
    write(address: number, value: number): void {
        if (address < 0x2000) {
            RAM[address & 0x7ff] = value;
            return;
        }
        if (address === 0x2000) {
            // PPUCTRL
            if (value === 0x90) {
                // backgroundTile = Boolean(value & 0b10000)
                this.nmiEnabled = Boolean(value & 0b10000000);
            }
            return;
        }
        if (address === 0x2001) {
            // PPUMASK, ignore
            return;
        }
        if (address === 0x2003) {
            // OAMADDR
            return;
        }
        if (address === 0x2005) {
            // PPUSCROLL, ignore
            return;
        }
        if (address === 0x2006) {
            if (this.ppuAddrIndex === 0) {
                this.ppuAddr = value;
            } else {
                this.ppuAddr = (this.ppuAddr << 8) + value;
            }
            this.ppuAddrIndex ^= 1;
            return;
        }
        if (address === 0x2007) {
            const addr = this.ppuAddr & 0x3fff;
            VRAM[addr] = value;
            if (!this.nametableDirty && addr >= 0x2000 && addr < 0x2fc0) {
                this.nametableDirty = true;
            }
            this.ppuAddr++;
            return;
        }
        if (address === 0x4016) {
            // joypad
            return;
        }
        if ((address >= 0x4000 && address <= 0x4015) || address === 0x4017) {
            // APU
            return;
        }

        if (address >= 0x8000 && address <= 0x9FFF) {
            // MMC1 Control
            return;
        }

        if (address === 0xbfff) {
            if (this.chr0Index === 0) {
                this.chr0 = value;
            }
            this.chr0Index = (this.chr0Index + 1) % 5;
            return; // ChangeCHRBank0
        }
        if (address === 0xdfff) return; // ChangeCHRBank1

        console.log(['last', Number(cpu.state.p).toString(16)]);
        console.error('write', address.toString(16), value.toString(16));
    }
    peek(address: number): number {
        return this.read(address);
    }
    poke(address: number, value: number): void {
        return this.write(address, value);
    }
    readWord(address: number): number {
        console.error('readWord', address.toString(16));
        return 0;
    }
}

const bus = new TetrisBus();
const cpu = new StateMachineCpu(bus);
const disasm = new Disassembler(bus);

const nmiCycles = 2273;

const interval = setInterval(() => {
    const totalCycles = 29780 + (bus.frames & 1); // NTSC

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

    renderSprites();

    for (let i = 0; i < nmiCycles; i++) {
        if (cpu.executionState === 1) {
            // console.log([Number(cpu.state.p).toString(16),  disasm.disassembleAt(cpu.state.p)]);
        }

        cpu.cycle();
        // if no nmi, break
    }


    // check interrupts

    debugRAM();
    if (bus.frames !== 0 && bus.nametableDirty) {
        bus.nametableDirty = false;
        renderBG();
    }

    if (++bus.frames > 6) {
        // clearInterval(interval);
    }
}, 1);

// RENDER

const screen = document.body.appendChild(document.createElement('div'));
screen.className = 'screen';

const background = screen.appendChild(document.createElement('canvas'));
background.width = 256;
background.height = 240;
const ctx = background.getContext('2d') as CanvasRenderingContext2D;

// https://emulation.gametechwiki.com/index.php/Famicom_Color_Palette
const paletteDebug = document.body.appendChild(document.createElement('div'));
paletteDebug.style.display = 'flex';

function renderBG() {
    let cursor = 0;

    const palettes = [
        VRAM.slice(0x3f00, 0x3f04),
        VRAM.slice(0x3f04, 0x3f08),
        VRAM.slice(0x3f08, 0x3f0c),
        VRAM.slice(0x3f0c, 0x3f10),
    ];

    paletteDebug.innerHTML = '';
    palettes
        .map((d) => Array.from(d))
        .flat()
        .forEach((color) => {
            const box = document.createElement('div');
            box.textContent = color.toString(16);
            box.style.backgroundColor =
                '#' + colors[color].toString(16).padStart(6, '0');
            paletteDebug.appendChild(box);
        });

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
                if (greyscale) {
                    imageData.data[i * 4 + 0] = 85 * pixel;
                    imageData.data[i * 4 + 1] = 85 * pixel;
                    imageData.data[i * 4 + 2] = 85 * pixel;
                } else {
                    const color = colors[palette[pixel]];
                    imageData.data[i * 4 + 0] = color >> 16;
                    imageData.data[i * 4 + 1] = (color >> 8) & 0xff;
                    imageData.data[i * 4 + 2] = color & 0xff;
                }
                imageData.data[i * 4 + 3] = 255;
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
        // assume attribute like this are bad
        if (tile !== 0xFF && tile !== 0xEF && x !== 0 && attr !== 0xFF) {
            const palette = palettes[attr & 0b11];

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

            pixels.forEach((pixel, i) => {
                if (greyscale) {
                    imageData.data[i * 4 + 0] = 85 * pixel;
                    imageData.data[i * 4 + 1] = 85 * pixel;
                    imageData.data[i * 4 + 2] = 85 * pixel;
                } else {
                    const color = colors[palette[pixel]];
                    imageData.data[i * 4 + 0] = color >> 16;
                    imageData.data[i * 4 + 1] = (color >> 8) & 0xff;
                    imageData.data[i * 4 + 2] = color & 0xff;
                }
                imageData.data[i * 4 + 3] = 255;
            });

            spCtx.putImageData(imageData, x === 255 ? 40 : x, y + 1);
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
