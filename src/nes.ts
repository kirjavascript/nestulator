import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import TetrisBus from './bus';

enum Region {
    NTSC,
    PAL,
    GYM,
}

export default class NES {
    cpu: StateMachineCpu;
    bus: TetrisBus;
    PRG: Uint8Array;
    CHR: Uint8Array;
    RAM: Uint8Array;
    VRAM: Uint8Array;
    region: Region;

    constructor(ROM: Uint8Array) {
        this.bus = new TetrisBus(this);
        this.cpu = new StateMachineCpu(this.bus);
        this.PRG = ROM.slice(0x10, 0x8010);
        this.CHR = ROM.slice(0x8010); // 2bpp, 16 per tile
        this.RAM = new Uint8Array(0x2000);
        this.VRAM = new Uint8Array(0x4000);

        const dropTable = this.PRG[0x98E];
        if (dropTable === 0x30) {
            this.region = Region.NTSC;
        } else if (dropTable === 0x24) {
            this.region = Region.PAL;
        } else {
            this.region = Region.GYM;
        }
    }
}
