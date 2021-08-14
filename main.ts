import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import Disassembler from '6502.ts/lib/machine/cpu/Disassembler';
import tetrisROM from './tetris.nes';

// foxNES/CTMulator

// arraybuffers for ram

const PAL = false;
const header = tetrisROM.slice(0, 0xf);
const PRG = tetrisROM.slice(0x10, 0x800f);
const CHR = tetrisROM.slice(0x8010);
let chrPointer = 0;
const RAM = new Uint8Array(0x2000);

class TetrisBus implements BusInterface {
    read(address: number) {
        if (address === 0xfffa) return 0x05; // nmi
        if (address === 0xfffb) return 0x80;
        if (address === 0xfffc) return 0x0; // initRam
        if (address === 0xfffd) return 0x80;
        if (address === 0xfffe) return 0x4a; // irq
        if (address === 0xffff) return 0x80;

        if (address < 0x2000) {
            return RAM[address & 0x7ff];
        }
        // ROM
        if (address >= 0x8000) {
            return PRG[address - 0x8000];
        }
        console.error('read', address.toString(16));
        return 0;
    }
    peek(address: number): number {
        return this.read(address);
    }
    readWord(address: number): number {
        console.error('readWord', address.toString(16));
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
                // NMI enable
                // background tile select
            }
            return;
        }
        if (address === 0x2001) {
            // PPUMASK
            return;
        }
        if (address === 0x2005) {
            // PPUSCROLL, ignore
            return;
        }
        if (address >= 0x4000 && address <= 0x4017) {
            // APU
            return;
        }

        console.log(['last', Number(cpu.state.p).toString(16)]);
        console.error('write', address.toString(16), value.toString(16));
    }
    poke(address: number, value: number): void {
        console.error('poke', address.toString(16));
    }
}

const bus = new TetrisBus();
const cpu = new StateMachineCpu(bus);
const disasm = new Disassembler(bus);

// cpu.state.p = 0x4000;
// cpu._lastInstructionPointer = 0x4000

// interface BusInterface {
//     read(address: number): number;
//     peek(address: number): number;
//     readWord(address: number): number;
//     write(address: number, value: number): void;
//     poke(address: number, value: number): void;
// }

// TODO: vectors

// TODO: load tetris ROM
// TODO: dump PC each cycle

// TODO: get running at fullspeed, fast

let frames = 0;

const interval = setInterval(() => {
    for (let i = 0; i < 29780; i++) {
        //  29780 +/- 1

        if (cpu.executionState === 1) {
            // console.log([Number(cpu.state.p).toString(16),  disasm.disassembleAt(cpu.state.p)]);
        }

        cpu.cycle();
        // optimization if (checkForNMI) break
    }

    cpu.nmi();

    // check interrupts

    console.log(cpu.state.p.toString(16));
    debugRAM();
    // TODO: instead of running x number, of cycles, skip from the rom to vblank

    if (++frames >= 5) {
        clearInterval(interval);
    }
}, 1000);

const debug = document.body.appendChild(document.createElement('pre'));

function debugRAM() {
    const lines = [];
    const d = [...RAM];
    for (let cursor = 0; d.length; cursor += 16) {
        lines.push(
            `0x${(cursor).toString(16).padStart(4, '0')}: ` +
                d
                    .splice(0, 16)
                    .map((d) => d.toString(16).padStart(2, '0'))
                    .join(','),
        );
    }
    debug.innerHTML = `frames: ${frames}\n${lines.join('\n')}`;
}

// https://wiki.nesdev.com/w/index.php/Cycle_reference_chart
// watching
//
//
