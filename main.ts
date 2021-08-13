import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import Disassembler from '6502.ts/lib/machine/cpu/Disassembler';
import tetrisROM from './tetris.nes';

// foxNES/CTMulator

// arraybuffers for ram

const PAL = false;
const header = tetrisROM.slice(0, 0xF);
const PRG = tetrisROM.slice(0x10, 0x800F);
const CHR = tetrisROM.slice(0x8010);
let chrPointer = 0;
const RAM = new Uint8Array(0x2000);


class TetrisBus implements BusInterface {
    read(address: number) {
    // $FFFA-$FFFB = NMI vector
    // $FFFC-$FFFD = Reset vector
    // $FFFE-$FFFF = IRQ/BRK vector
        if (address === 0xFFFD) return 0x80;
        if (address === 0xFFFC) return 0x0;


        // RAM
        if (address < 0x2000) {
            return RAM[address & 0x7FF];
        }
        // ROM
        if (address >= 0x8000) {
            return PRG[address - 0x8000];
        }
        return 0;
    }
    peek(address: number): number {
        return this.read(address);
    };
    readWord(address: number): number {

        console.error('readWord', address.toString(16));
        return 0};
    write(address: number, value: number): void {
        if (address < 0x2000) {
            RAM[address & 0x7FF] = value;
        } else {

            console.log([Number(cpu.state.p).toString(16),  disasm.disassembleAt(cpu.state.p)]);
            console.error('write', address.toString(16), value.toString(16));
        }
    };
    poke(address: number, value: number): void {
        console.error('poke', address.toString(16));
    };
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

setInterval(() => {
    for (let i = 0; i < 1000; i++) {

        if (cpu.executionState === 1) {
            // console.log([Number(cpu.state.p).toString(16),  disasm.disassembleAt(cpu.state.p)]);
        }

        cpu.cycle();
    }

            debugRAM();
    // TODO: instead of running x number, of cycles, skip from the rom to vblank
}, 100)

const debug = document.body.appendChild(document.createElement('pre'));

function debugRAM() {
    const lines = [];
    const d = [...RAM];
    while(d.length) {
        lines.push(d.splice(0, 16).map(d=>d.toString(16).padStart(2,0)));
        // tsconfig 2017
    }
    debug.innerHTML = lines.join('\n');
}



// https://wiki.nesdev.com/w/index.php/Cycle_reference_chart
// watching
//
//
