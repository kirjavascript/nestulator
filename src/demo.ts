import NES from './nes';

export default class Demo {
    nes: NES;
    frameData: [];
    constructor(nes: NES) {
        this.nes = nes;

    }

    // decentralised format / no crypto / open format
    // notice: ms timing with frames being 0 or 2
    // RNG, inputs, timestamp, framecount, spawnCount,

    initGame() {

    }

    saveFrame() {

    }
}
