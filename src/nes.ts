import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import TetrisBus from './bus';
import { renderBG, renderSprites } from './render';
import { playSFX } from './audio';

const nmiCycles = 2273;

export enum Region {
    NTSC,
    PAL,
    GYM,
}

export default class NES {
    cpu: StateMachineCpu;
    bus: TetrisBus;
    PRG!: Uint8Array;
    CHR!: Uint8Array;
    RAM: Uint8Array = new Uint8Array(0x2000);
    VRAM: Uint8Array = new Uint8Array(0x4000);
    tiles: Array<Array<number>> = [];
    region: Region = Region.NTSC;
    framerate!: number;
    baseCycles!: number;
    running!: boolean;
    runahead: boolean = true;

    public constructor(ROM: Uint8Array = new Uint8Array()) {
        this.bus = new TetrisBus(this);
        this.cpu = new StateMachineCpu(this.bus);
        this.setROM(ROM);
    }

    public setROM(ROM: Uint8Array) {
        this.PRG = ROM.slice(0x10, 0x8010);
        this.CHR = ROM.slice(0x8010); // 2bpp, 16 per tile
        this.running = !!ROM.length;
        this.cpu.reset();

        this.tiles.splice(0, this.tiles.length);

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

        // region stuff

        const dropTable = this.PRG[0x98E];
        if (dropTable === 0x30) {
            this.region = Region.NTSC;
        } else if (dropTable === 0x24) {
            this.region = Region.PAL;
        } else {
            this.region = Region.GYM;
        }

        this.framerate = this.region === Region.PAL ? 0.0500069 : 0.0600988;
        // this value doesnt really matter as we skip a lot of cycles
        this.baseCycles = this.region === Region.PAL ? 33247 : 29780;

        // patches
        if (this.region !== Region.GYM) {
            this.PRG[0x1C89] = 0xFA; // maxout
            this.PRG[0x180C] = 0x90; // fix colours
        }
    }

    public frame(shouldRender: boolean) {
        if (shouldRender && this.runahead) {
            this.cpuFrame(false);
            const RAM = this.RAM.slice(0);
            const VRAM = this.VRAM.slice(0);
            const state = { ...this.cpu.state };
            const cpu = { ...this.cpu };
            const bus = { ...this.bus };
            this.cpuFrame(true);
            // rollback
            this.RAM = RAM;
            this.VRAM = VRAM;
            Object.assign(this.bus, bus);
            Object.assign(this.cpu, cpu);
            Object.assign(this.cpu.state, state);
            this.bus.backgroundDirty = false;
        } else {
            this.cpuFrame(shouldRender);
        }
    }

    private cpuFrame(shouldRender: boolean){
        const totalCycles = this.baseCycles + (this.bus.frames & 1);

        this.bus.nmiChecked = false;
        this.bus.vblank = false;

        for (let i = 0; i < totalCycles - nmiCycles; i++) {
            this.cpu.cycle();
            // if waiting for NMI, skip to it
            // @ts-ignore
            if (this.bus.nmiChecked === true) break;
        }

        if (shouldRender) {
            renderSprites(this);
        }

        if (this.bus.nmiEnabled) {
            this.bus.vblank = true;
            this.cpu.nmi();
        }

        const afterCycles = this.RAM[0xC0] === 3
            ? 1300 // workaround for level select screen bug
            : nmiCycles;

        for (let i = 0; i < afterCycles; i++) {
            this.cpu.cycle();
            // do nmi cycles... and some of the next frame
        }

        // unless we align executionState rollback doesn work
        while (this.cpu.executionState !== 1) {
            this.cpu.cycle();
        }

        playSFX(this);

        if (shouldRender) {
            renderBG(this);
        }

        this.bus.frames++;
    }
}
