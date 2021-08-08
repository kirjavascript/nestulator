import StateMachineCpu from '6502.ts/lib/machine/cpu/StateMachineCpu';
import BusInterface from '6502.ts/lib/machine/bus/BusInterface';
import tetrisROM from './tetris.nes';

console.log(123);

const CHR = [];
const PRG = [];

const SRAM = new Uint8Array();

// arraybuffers for ram

class TetrisBus implements BusInterface {
    read(address: number) {
        console.log('read', address);
        return 0;
    }
    peek(address: number): number { return 0; };
    readWord(address: number): number { return 0};
    write(address: number, value: number): void {};
    poke(address: number, value: number): void {};
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

console.log(cpu.cycle());

//https://wiki.nesdev.com/w/index.php/Cycle_reference_chart
// watching
