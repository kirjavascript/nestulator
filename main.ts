import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import tetrisROM from './tetris.nes';

// foxNES/CTMulator

const header = tetrisROM.slice(0, 0xF);
const PRG = tetrisROM.slice(0x10, 0x800F);
const CHR = tetrisROM.slice(0x8010);
const RAM = new Uint8Array(0x2000);

// arraybuffers for ram

class TetrisBus implements BusInterface {
    read(address: number) {
        console.log('read', address);
        return 0;
    }
    peek(address: number): number {
        console.log('peek', address);
        return 0;
    };
    readWord(address: number): number {

        console.log('readWord', address);
        return 0};
    write(address: number, value: number): void {
        console.log('write', address);
    };
    poke(address: number, value: number): void {
        console.log('poke', address);
    };
}

const cpu = new StateMachineCpu(new TetrisBus());


// interface BusInterface {
//     read(address: number): number;
//     peek(address: number): number;
//     readWord(address: number): number;
//     write(address: number, value: number): void;
//     poke(address: number, value: number): void;
// }

// TODO: load tetris ROM

const loop: () => void = () => requestAnimationFrame(() => {
    if (!(Date.now() % 10)) {
        cpu.cycle();
    }
    loop();
});
loop();

//https://wiki.nesdev.com/w/index.php/Cycle_reference_chart
// watching
//
//
