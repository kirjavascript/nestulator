import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import buttonIsDown from './joypad';
import NES from './nes';

export default class TetrisBus implements BusInterface {
    nes: NES;
    frames: number = 0;
    vblank: boolean = false;
    nmiEnabled: boolean = true;
    nmiChecked: boolean = false;
    ppuAddr: number = 0;
    ppuAddrIndex: number = 0;
    chr0: number = 0;
    chr0Index: number = 0;
    joyIndex: number = 0;
    backgroundDirty: boolean = false;
    backgroundDisplay: boolean = true;
    sfx: number = 0;
    constructor(nes: NES) {
        this.nes = nes;
    }
    read(address: number): number {
        // vectors
        if (address === 0xfffa) return 0x05; // nmi
        if (address === 0xfffb) return 0x80;
        if (address === 0xfffc) return 0x0; // initRam
        if (address === 0xfffd) return 0x80;
        if (address === 0xfffe) return 0x4a; // irq
        if (address === 0xffff) return 0x80;

        if (address === 0x33) {
            // perf hack: if the rom is waiting for NMI, just skip to it
            this.nmiChecked = true;
            return this.nes.RAM[0x33];
        }

        if (address < 0x2000) {
            // RAM
            return this.nes.RAM[address & 0x7ff];
        }

        if (address === 0x2002) {
            // PPUSTATUS
            return this.vblank ? 0x40 : 0;
        }

        if ((address >= 0x4000 && address <= 0x4015) || address === 0x4017) {
            // APU
            return 0;
        }

        if (address === 0x4016) {
            const isDown = buttonIsDown(this.joyIndex);
            this.joyIndex = (this.joyIndex + 1) % 8;
            return +isDown;
        }

        if (address === 0x4017) return 0; // joypad2

        if (address >= 0x8000) {
            // ROM
            return this.nes.PRG[address - 0x8000];
        }

        console.log(['last', Number(this.nes.cpu.state.p).toString(16)]);
        console.error('read', address.toString(16));
        return 0;
    }
    write(address: number, value: number): void {
        if (address === 0xA3) {
            if (value === 0x47) {
                // outOfDateRenderFlags set to this value on initGameState
                // and this is where we should update the palette for the piece counts
                this.backgroundDirty = true;
                this.nes.gfx.setupFlashMask(this.nes);
            }
            this.nes.RAM[0xA3] = value;
            return;
        }
        if (address === 0x6F1 && value !== 0) {
            // sound effect slot 1 init
            this.sfx = value;
            return;
        }
        if (address < 0x2000) {
            this.nes.RAM[address & 0x7ff] = value;
            return;
        }
        if (address === 0x2000) {
            // PPUCTRL
            if (value === 0x90) {
                this.nmiEnabled = !!(value & 0b10000000);
            }
            return;
        }
        if (address === 0x2001) {
            // PPUMASK
            const showBackground = !!(value & 0b1000);
            if (showBackground !== this.backgroundDisplay) {
                this.backgroundDirty = true;
            }
            this.backgroundDisplay = showBackground;
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
            // PPUADDR
            if (this.ppuAddrIndex === 0) {
                this.ppuAddr = value;
            } else {
                this.ppuAddr = (this.ppuAddr << 8) + value;
            }
            this.ppuAddrIndex ^= 1;
            return;
        }
        if (address === 0x2007) {
            // PPUDATA
            const addr = this.ppuAddr & 0x3fff;
            this.nes.VRAM[addr] = value;
            if (addr >= 0x2000 && addr < 0x23C0) {
                this.nes.ntUpdates.push(addr - 0x2000);
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
        if (address >= 0x8000 && address <= 0x9fff) {
            // MMC1 Control
            return;
        }
        if (address === 0xbfff) {
            if (this.chr0Index === 0) {
                this.chr0 = value;
            }
            this.chr0Index = (this.chr0Index + 1) % 5;
            return; // ChangeCHRBank0
        }
        if (address === 0xdfff) return; // ChangeCHRBank1

        console.log(['last', Number(this.nes.cpu.state.p).toString(16)]);
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
