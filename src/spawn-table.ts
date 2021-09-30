import NES from './nes';
import { pieces } from './search-params';
import * as ADDR from './ram-addr';

const spawnTable = [0x02, 0x07, 0x08, 0x0a, 0x0b, 0x0e, 0x12];
const tableLookup = 'TJZOSLI';

export default class SpawnTable {
    nes: NES;
    offset: number;
    patching: boolean = false;
    pieces: Array<number> = [];
    lastCount: number = 1;
    index: number = 0;

    public constructor(nes: NES) {
        this.nes = nes;

        // spawnTable is the same in every ROM
        this.offset =
            this.nes.PRG.findIndex((_, i, a) => {
                return a.slice(i, i + 7).every((d, i) => d === spawnTable[i]);
            }) + 0x8000;

        this.pieces = pieces.map(
            (piece) => spawnTable[tableLookup.indexOf(piece)] || 0x2,
        );
        this.patching = this.pieces.length > 0;
    }

    public next(): number {
        const spawnCount = this.nes.RAM[ADDR.spawnCount];
        if (spawnCount !== this.lastCount) {
            this.index++;
            this.lastCount = spawnCount;
        }
        return this.pieces[this.index % this.pieces.length];
    }
}
