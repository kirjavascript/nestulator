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
            const now = (new Date).getTime();
            const frameData = [
                this.nes.bus.frames,
                now,
                Array.from({ length: 8 }, (_, i) => buttonIsDown(i)),
                shouldRender,
                this.nes.RAM[now % 0x100],
                this.nes.RAM[ADDR.tetriminoX],
                this.nes.RAM[ADDR.tetriminoY],
                this.nes.RAM[ADDR.currentPiece],
                this.nes.RAM[ADDR.player1_vramRow],
                this.nes.RAM.slice(0x53, 0x56),
                this.nes.RAM.slice(0x17, 0x1b),
            ];

            this.frames.push(frameData);
        }
    }
}
