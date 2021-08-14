import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import Disassembler from '6502.ts/lib/machine/cpu/Disassembler';
import tetrisROM from './tetris.nes';

// foxNES/CTMulator

// TODO: skip vram writes and just read from CHR
// arraybuffers for ram

const PAL = false;
const header = tetrisROM.slice(0, 0xf);
const PRG = tetrisROM.slice(0x10, 0x800f);
const CHR = tetrisROM.slice(0x8010);
let chrPointer = 0;
const RAM = new Uint8Array(0x2000);
const VRAM = new Uint8Array(0x4000);

class TetrisBus implements BusInterface {
    frames: number = 0;
    vblank: boolean = false;
    nmiEnabled: boolean = true;
    ppuAddr: number = 0;
    ppuAddrIndex: number = 0;
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
            VRAM[this.ppuAddr & 0x3FFF] = value;
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

        if (address === 0xBFFF) return; // MMC_Control
        if (address === 0xDFFF) return; // ChangeCHRBank
        // if (address === 0xDFFF) {
        //     console.error('ChangeCHRBank', value);
        //     return;
        // }

        console.log(['last', Number(cpu.state.p).toString(16)]);
        console.error('write', address.toString(16), value.toString(16));
    }
    peek(address: number): number {
        return this.read(address);
    }
    poke(address: number, value: number): void {
        return this.write(address, value)
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
    const totalCycles = 29780 + (bus.frames & 1) // NTSC

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

    if (++bus.frames > 60) {
        clearInterval(interval);
    }
}, 1);



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
    debug.innerHTML = `PC: ${cpu.state.p.toString(16)}\nframes: ${bus.frames}\n${lines.join('\n')}`;
}
