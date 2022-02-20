import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import TetrisBus from './bus';
import TetrisGfx from './gfx';
import SpawnTable from './spawn-table';
import { playSFX } from './audio';
import * as ADDR from './ram-addr';

const nmiCycles = 2273;

export enum Region {
    NTSC,
    PAL,
    GYM,
}

export default class NES {
    cpu: StateMachineCpu;
    bus: TetrisBus;
    gfx: TetrisGfx;
    PRG!: Uint8Array;
    CHR!: Uint8Array;
    RAM: Uint8Array = new Uint8Array(0x2000);
    VRAM: Uint8Array = new Uint8Array(0x4000);
    tiles: Array<Array<number>> = [];
    ntUpdates: Array<number> = [];
    lastOAM: Uint8Array = new Uint8Array(0x100);
    region: Region = Region.NTSC;
    spawnTable!: SpawnTable;
    framerate!: number;
    baseCycles!: number;
    running!: boolean;
    sfxEnabled: boolean = false;
    runahead: boolean = true;

    public constructor(ROM: Uint8Array = new Uint8Array()) {
        this.gfx = new TetrisGfx();
        this.bus = new TetrisBus(this);
        this.cpu = new StateMachineCpu(this.bus);
        this.setROM(ROM);
    }

    public setROM(ROM: Uint8Array) {
        this.PRG = ROM.slice(0x10, 0x8010);
        this.CHR = ROM.slice(0x8010); // 2bpp, 16 per tile
        this.running = !!ROM.length;
        this.cpu.reset();
        this.gfx.removeFlashMask();

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

        this.spawnTable = new SpawnTable(this);

        // region stuff

        const dropTable = this.PRG[0x98e];
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
            this.PRG[0x1c89] = 0xfa; // maxout
            this.PRG[0x180c] = 0x90; // fix colours
            // this.PRG[0x1a91] = 0x0; // auto win
            // this.PRG[0x1bec] = 0xa5; // transition
        }
    }

    // user API

    public changeLevel(level: number) {
        this.RAM[ADDR.outOfDateRenderFlags] = 0b10;
        this.RAM[ADDR.player1_levelNumber] = level;
        this.RAM[ADDR.levelNumber] = level;
    }

    public setScore(score: number) {
        const strScore = String(score).padStart(6, '0')
        this.RAM[ADDR.outOfDateRenderFlags] = 0b100;
        this.RAM[ADDR.player1_score] = parseInt(strScore.slice(4, 6), 16);
        this.RAM[ADDR.player1_score+1] = parseInt(strScore.slice(2, 4), 16);
        this.RAM[ADDR.player1_score+2] = parseInt(strScore.slice(0, 2), 16);
    }

    public setMino(x: number, y: number, value: number) {
        this.RAM[ADDR.playfield + x + (y * 0xA)] = value;
    }

    public clearPlayfield() {
        for (let i = 0; i < 200; i++) {
            this.RAM[ADDR.playfield + i] = 0xEF;
        }
    }

    public vramLoop() {
        if (this.RAM[ADDR.player1_vramRow] === 32) {
            this.RAM[ADDR.player1_vramRow] = 0;
            this.RAM[ADDR.vramRow] = 0;
        }
    }

    // event hooks

    public initGameState() {
        // happens twice in quick succession when a game is started
        //https://github.com/6502ts/6502.ts/blob/master/doc/cpu.md#memory-access-patterns
        this.gfx.setupFlashMask(this);
        // we need to update the palette for the piece counts
        this.gfx.updateStatPiecePalette(this);
    }

    public levelUp() {
        this.gfx.updateStatPiecePalette(this);
    }

    public setRenderMode(mode: number) {
        // happens twice each change
        if ((mode & 0xE) === 0) {
            // set on 'menu' screens
            // cannot use the level select screen index alone because of tetrisgym
            this.spawnTable.reset();
        }
    }

    // rendering

    public frame(shouldRender: boolean) {
        if (shouldRender && this.runahead) {
            this.cpuFrame(false);
            const RAM = this.RAM.slice(0);
            // technically VRAM should also be saved/restored here
            // but not doing so has no effect and is faster
            const state = Object.assign({}, this.cpu.state);
            const cpu = Object.assign({}, this.cpu);
            const bus = Object.assign({}, this.bus);
            this.cpuFrame(true);
            // rollback
            this.RAM = RAM;
            Object.assign(this.bus, bus);
            Object.assign(this.cpu, cpu);
            Object.assign(this.cpu.state, state);
            this.bus.backgroundDirty = false;
            this.bus.sfx = 0;

        } else {
            this.cpuFrame(shouldRender);
        }
    }

    private cpuFrame(shouldRender: boolean) {
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
            this.gfx.renderSprites(this);
        }

        if (this.bus.nmiEnabled) {
            this.bus.vblank = true;

            // transitioning between gameMode and levelSelect blackscreens sometimes
            // skipping nmi on a frame where this happens fixes it
            // (this can definitely be improved)

            if (this.RAM[ADDR.gameMode] !== 3 || this.bus.frames % 60 !== 0) {
                this.cpu.nmi();
            }
        }

        const afterCycles =
            this.RAM[ADDR.gameMode] === 3
                ? 1300 // workaround for level select screen bug
                : nmiCycles;

        for (let i = 0; i < afterCycles; i++) {
            this.cpu.cycle();
            // do nmi cycles... and some of the next frame
        }

        // unless we align executionState rollback doesnt work
        while (this.cpu.executionState !== 1) {
            this.cpu.cycle();
        }

        if (shouldRender) {
            this.sfxEnabled && playSFX(this);
            this.gfx.renderBG(this);
        }

        this.bus.frames++;
    }
}
