"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Region = void 0;
const StateMachineCpu_1 = __importDefault(require("6502.ts/lib/machine/cpu/StateMachineCpu"));
const bus_1 = __importDefault(require("./bus"));
var Region;
(function (Region) {
    Region[Region["NTSC"] = 0] = "NTSC";
    Region[Region["PAL"] = 1] = "PAL";
    Region[Region["GYM"] = 2] = "GYM";
})(Region = exports.Region || (exports.Region = {}));
class NES {
    constructor(ROM) {
        this.bus = new bus_1.default(this);
        this.cpu = new StateMachineCpu_1.default(this.bus);
        this.PRG = ROM.slice(0x10, 0x8010);
        this.CHR = ROM.slice(0x8010); // 2bpp, 16 per tile
        this.RAM = new Uint8Array(0x2000);
        this.VRAM = new Uint8Array(0x4000);
        const dropTable = this.PRG[0x98E];
        if (dropTable === 0x30) {
            this.region = Region.NTSC;
        }
        else if (dropTable === 0x24) {
            this.region = Region.PAL;
        }
        else {
            this.region = Region.GYM;
        }
    }
}
exports.default = NES;
