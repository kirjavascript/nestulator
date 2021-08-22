import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import TetrisBus from './bus';

export enum Region {
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
    tiles: Array<Array<number>>;
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

        this.tiles = [];

        for (let cursor = 0; cursor < this.CHR.length; cursor += 0x10) {
            const pixels = [];
            const chrData = this.CHR.slice(cursor, cursor + 0x10);
            for (let i = 0; i < 8; i++) {
                // this code is slow but also quite funny and only run once
                const high = chrData[i].toString(2).padStart(8, '0');
                const low = chrData[i + 8].toString(2).padStart(8, '0');
                for (let j = 0; j < 8; j++) {
                    pixels.push(parseInt(low[j] + high[j], 2));
                }
            }
            this.tiles.push(pixels);
        }


    }

}
