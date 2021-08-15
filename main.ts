import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import Disassembler from '6502.ts/lib/machine/cpu/Disassembler';
import tetrisROM from './tetris.nes';

// fast and accurate (with hacks)
// foxNES/CTMulator

// TODO: skip vram writes and just read from CHR
// TODO: runahead
// TODO: background and sprites on different canvases
// arraybuffers for ram

const PAL = false;
const header = tetrisROM.slice(0, 0x10);
const PRG = tetrisROM.slice(0x10, 0x8010);
const CHR = tetrisROM.slice(0x8010); // 2bpp, 16 per tile
const RAM = new Uint8Array(0x2000);
const VRAM = new Uint8Array(0x4000);

class TetrisBus implements BusInterface {
    frames: number = 0;
    vblank: boolean = false;
    nmiEnabled: boolean = true;
    ppuAddr: number = 0;
    ppuAddrIndex: number = 0;
    nametableDirty: boolean = false;
    // chrPointer
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

        if (address === 0x4016 || address === 0x4017) {
            // joypad
            return;
        }

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

        if (address === 0xbfff) return; // ChangeCHRBank0
        if (address === 0xdfff) return; // ChangeCHRBank1
        // if (address === 0xDFFF) {
        //     console.error('ChangeCHRBank1', value);
        //     return;
        // }

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
        clearInterval(interval);
    }
}, 1);

// screen

const canvas = document.body.appendChild(document.createElement('canvas'));

canvas.width = 256;
canvas.height = 240;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const colors = [
    0x7c7c7c,
    0x0000fc,
    0x0000bc,
    0x4428bc,
    0x940084,
    0xa80020,
    0xa81000,
    0x881400,
    0x503000,
    0x007800,
    0x006800,
    0x005800,
    0x004058,
    0x000000,
    0x000000,
    0x000000,
    0xbcbcbc,
    0x0078f8,
    0x0058f8,
    0x6844fc,
    0xd800cc,
    0xe40058,
    0xf83800,
    0xe45c10,
    0xac7c00,
    0x00b800,
    0x00a800,
    0x00a844,
    0x008888,
    0x000000,
    0x000000,
    0x000000,
    0xf8f8f8,
    0x3cbcfc,
    0x6888fc,
    0x9878f8,
    0xf878f8,
    0xf85898,
    0xf87858,
    0xfca044,
    0xf8b800,
    0xb8f818,
    0x58d854,
    0x58f898,
    0x00e8d8,
    0x787878,
    0x000000,
    0x000000,
    0xfcfcfc,
    0xa4e4fc,
    0xb8b8f8,
    0xd8b8f8,
    0xf8b8f8,
    0xf8a4c0,
    0xf0d0b0,
    0xfce0a8,
    0xf8d878,
    0xd8f878,
    0xb8f8b8,
    0xb8f8d8,
    0x00fcfc,
    0xf8d8f8,
    0x000000,
    0x000000,
];

// https://emulation.gametechwiki.com/index.php/Famicom_Color_Palette
const paletteDebug = document.body.appendChild(document.createElement('div'));

function renderBG() {
    let cursor = 0;

    const palettes = [
        VRAM.slice(0x3f01, 0x3f04),
        VRAM.slice(0x3f05, 0x3f08),
        VRAM.slice(0x3f09, 0x3f0c),
        VRAM.slice(0x3f0d, 0x3f10),
    ].map((line) => [0xf, ...line]);

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
            // paletteDebug.appendChild(Object.assign(, {
            //     textContent: color.toString(16),
            //     style: {

            //         // backgroundColor: '#' + colors[color].toString(16),
            //         backgroundColor:'red',
            //     },
            // }));
        });

    for (let y = 0; y < canvas.height / 8; y++) {
        for (let x = 0; x < canvas.width / 8; x++) {
            const tile = VRAM[0x2000 + cursor++];

            const attrIndex = Math.floor(x / 2) + (Math.floor(y*2 )) + 0x23c0;
            const attr = VRAM[attrIndex];
            if (bus.frames === 6) {

            console.log(x, y, attr, attrIndex.toString(16));
            }
            const shift = ((x & 1) * 2) + ((y & 1) * 4);
            const paletteLine = (attr >> shift) & 0b11;
            const palette = palettes[paletteLine];
            // console.log(palette, paletteLine);

            const chrOff = tile * 0x10;
            const chrData = CHR.slice(chrOff, chrOff + 0x10);

            // TODO: cache this stuff
            const pixels = [];
            for (let i = 0; i < 8; i++) {
                const high = chrData[i].toString(2).padStart(8, '0');
                const low = chrData[i + 8].toString(2).padStart(8, '0');
                for (let j = 0; j < 8; j++) {
                    pixels.push(parseInt(high[j] + low[j], 2));
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
        }
    }
}

const debug = document.body.appendChild(document.createElement('pre'));

function debugRAM() {
    const lines = [];
    const d = [...VRAM];
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
