import NES from './nes';
import { paletteHex, paletteRGB } from './colors';

// background

const background = document.querySelector('.background') as HTMLCanvasElement;
background.width = 256;
background.height = 240;
const ctx = background.getContext('2d') as CanvasRenderingContext2D;

const buffer = ctx.createImageData(8, 8);

const allTiles = [...Array(960).keys()];
const xyLookup: Array<[number, number]> = allTiles.map((i) => [
    i % 32,
    0 | (i / 32),
]);

// sprites

const sprites = document.querySelector('.sprites') as HTMLCanvasElement;
sprites.width = 256;
sprites.height = 240;
const spCtx = sprites.getContext('2d') as CanvasRenderingContext2D;
sprites.style.backgroundColor = 'transparent';

const OAM_THRESHOLD = 0x100;

// nt runahead saving

type ntUpdate = [[number, number], ImageData];
const ntTiles: Array<ntUpdate> = [];

export default class TetrisGfx {
    public renderBG(nes: NES) {
        if (!nes.bus.backgroundDisplay) {
            ctx.clearRect(0, 0, background.width, background.height);
            return;
        }

        if (nes.bus.backgroundDirty) {
            nes.ntUpdates = Array.from(allTiles);
            nes.bus.backgroundDirty = false;
        }
        if (nes.ntUpdates.length === 0) return;

        const palettes = [
            nes.VRAM.slice(0x3f00, 0x3f04),
            nes.VRAM.slice(0x3f04, 0x3f08),
            nes.VRAM.slice(0x3f08, 0x3f0c),
            nes.VRAM.slice(0x3f0c, 0x3f10),
        ];

        background.style.backgroundColor = paletteHex[palettes[0][0]];

        // uniq
        nes.ntUpdates = nes.ntUpdates.filter((d, i, a) => a.indexOf(d) === i)

        while (nes.ntUpdates.length) {
            const cursor = nes.ntUpdates.shift() as number;
            const x = xyLookup[cursor][0];
            const y = xyLookup[cursor][1];
            const tile = nes.VRAM[0x2000 + cursor];

            const attrIndex =
                Math.floor(x / 4) + Math.floor(y / 4) * 8 + 0x23c0;
            const attr = nes.VRAM[attrIndex];
            const shift = ((x / 2) & 1) * 2 + ((y / 2) & 1) * 4;
            const paletteLine = (attr >> shift) & 0b11;
            const palette = palettes[paletteLine];

            const pixels = nes.tiles[tile + nes.bus.chr0 * 0x100];

            for (let i = 0; i < 64; i++) {
                const pixel = pixels[i];
                if (pixel !== 0) {
                    // can ignore transparent pixels
                    const color = paletteRGB[palette[pixel]];
                    buffer.data[i * 4 + 0] = color[0];
                    buffer.data[i * 4 + 1] = color[1];
                    buffer.data[i * 4 + 2] = color[2];
                    buffer.data[i * 4 + 3] = 255;
                } else {
                    buffer.data[i * 4 + 3] = 0;
                }
            }

            ctx.putImageData(buffer, x * 8, y * 8);
        }
    }

    public renderSprites(nes: NES) {
        const { RAM, VRAM } = nes;
        const oam = RAM.slice(0x200, 0x300);

        // TODO OAM_THRESHOLD

        // diff oam
        let i = 0
        while (i < OAM_THRESHOLD) {
            if (oam[i] !== nes.lastOAM[i]) break;
            i++;
        }
        if (i === OAM_THRESHOLD) {
            return;
        }
        nes.lastOAM = oam;

        spCtx.clearRect(0, 0, sprites.width, sprites.height);

        const palettes = [
            VRAM.slice(0x3f10, 0x3f14),
            VRAM.slice(0x3f14, 0x3f18),
            VRAM.slice(0x3f18, 0x3f1c),
            VRAM.slice(0x3f1c, 0x3f20),
        ];

        for (let cursor = 0; cursor < OAM_THRESHOLD; cursor += 4) {
            const y = oam[cursor];
            const tile = oam[cursor + 1];
            const attr = oam[cursor + 2];
            const x = oam[cursor + 3];
            // assume attributes like this are bad
            if (tile !== 0xff && tile !== 0xef && x !== 0 && attr !== 0xff) {
                const palette = palettes[attr & 0b11];
                const vflip = !!(attr & 0b1000000);

                const pixels = nes.tiles[tile + nes.bus.chr0 * 0x100];

                for (let i = 0; i < 64; i++) {
                    const pixel = pixels[vflip ? 63 - i : i];
                    if (pixel !== 0) {
                        // can ignore transparent pixels
                        const color = paletteRGB[palette[pixel]];
                        buffer.data[i * 4 + 0] = color[0];
                        buffer.data[i * 4 + 1] = color[1];
                        buffer.data[i * 4 + 2] = color[2];
                        buffer.data[i * 4 + 3] = 255;
                    } else {
                        buffer.data[i * 4 + 3] = 0;
                    }
                }

                const yOffset = vflip ? y : y + 1;

                spCtx.putImageData(buffer, x, yOffset);
            }
        }
    }

    storeNTUpdates(nes: NES) {
        for (let ntIndex = 0; ntIndex < nes.ntUpdates.length; ntIndex++) {
            const cursor = xyLookup[nes.ntUpdates[ntIndex]];
            ntTiles.push([
                cursor,
                ctx.getImageData(cursor[0] * 8, cursor[1] * 8, 8, 8),
            ]);
        }
    }
    restoreNTUpdates() {
        while (ntTiles.length) {
            const next = ntTiles.shift() as ntUpdate;
            const cursor = next[0];
            const tile = next[1];
            ctx.putImageData(tile, cursor[0] * 8, cursor[1] * 8);
        }
    }
}
