import NES from './nes';
import { buttonIsDown } from './joypad';
import * as ADDR from './ram-addr';

export default class Demo {
    nes: NES;
    meta!: { timestamp: number, state: Uint8Array, startLevel: number };
    frames!: Array<any>;
    recording: boolean = false;
    constructor(nes: NES) {
        this.nes = nes;
    }

    // webtorrent demo share link
    // test.json

    // track CPU frame
    // checksum

    // decentralised format / no crypto / open format
    // notice: ms timing with frames being 0 or 2
    // paused
    // ith byte of ram

    startGame() {
        this.meta = {
            timestamp: (new Date).getTime(),
            state: this.nes.RAM.slice(0x17, 0x1b),
            startLevel: this.nes.RAM[ADDR.startLevel],
        };
        this.frames = [];
        this.recording = true;
    }

    endGame() {

    }

    frame(shouldRender: boolean) {
        if (this.recording) {
            console.log(this.nes.RAM[ADDR.gameModeState]);
            const now = (new Date).getTime();
            const checksum = now % 0x100;
            const held = this.nes.RAM[ADDR.heldButtons];
            const frameData = [
                now,
                this.nes.bus.frames,
                this.nes.RAM.slice(0x17, 0x1b),
                Array.from({ length: 8 }, (_, i) => buttonIsDown(i)),
                shouldRender,
                this.nes.RAM[checksum] | this.nes.RAM[checksum + 0x400] << 8,
                this.nes.RAM[held] | this.nes.RAM[held + 0x400] << 8,
            ];

            this.frames.push(frameData);
        }
    }
}
