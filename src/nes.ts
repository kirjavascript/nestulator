import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import TetrisBus from './bus';
import Disassembler from '6502.ts/lib/machine/cpu/Disassembler';

const nmiCycles = 2273;

export default class NES {
    cpu: StateMachineCpu;
    bus: TetrisBus;
    PRG: Uint8Array;
    CHR: Uint8Array;
    RAM: Uint8Array;
    VRAM: Uint8Array;

    constructor(ROM: Uint8Array) {
        this.bus = new TetrisBus(this);
        this.cpu = new StateMachineCpu(this.bus);
        const disasm = new Disassembler(this.bus);

        this.PRG = ROM.slice(0x10, 0x8010);
        this.CHR = ROM.slice(0x8010); // 2bpp, 16 per tile
        this.RAM = new Uint8Array(0x2000);
        this.VRAM = new Uint8Array(0x4000);
    }
}
