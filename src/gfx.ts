import NES from './nes';
import { paletteHex, paletteRGB } from './colors';

// background

const background = document.querySelector('.background') as HTMLCanvasElement;
background.width = 256;
background.height = 240;
const ctx = background.getContext('2d') as CanvasRenderingContext2D;

const buffer = ctx.createImageData(8, 8);

const allTiles = [...Array(960).keys()];
const xyLookup = allTiles.map(i => [i % 32, 0 | i / 32]);

// sprites

const sprites = document.querySelector('.sprites') as HTMLCanvasElement;
sprites.width = 256;
sprites.height = 240;
const spCtx = sprites.getContext('2d') as CanvasRenderingContext2D;
sprites.style.backgroundColor = 'transparent';

// nt runahead saving

let ntCursor;
let ntTiles;

export default class TetrisGfx {
    storeNTUpdates(nes: NES) {
        ntCursor = []
        ntTiles = [];
        for (let ntIndex = 0; ntIndex < nes.ntUpdates.length; ntIndex++) {
            const cursor = xyLookup[nes.ntUpdates[ntIndex]];
            ntCursor.push(cursor);
            ntTiles.push(ctx.getImageData(cursor[0] * 8, cursor[1] * 8, 8, 8));
        }
    }
    restoreNTUpdates(nes: NES) {
        for (let ntIndex = 0; ntIndex < ntCursor.length; ntIndex++) {
            const cursor = ntCursor[ntIndex];
            const tile = ntTiles[ntIndex];
            ctx.putImageData(tile, cursor[0] * 8, cursor[1] * 8);
        }
    }

    public renderBG(nes: NES) {
        if (!nes.bus.backgroundDisplay) {
            ctx.clearRect(0, 0, background.width, background.height);
            return;
        }

        if (nes.bus.backgroundDirty) {
            nes.ntUpdates = allTiles;
            nes.bus.backgroundDirty = false;
            console.log('dirty');
        }
        if (nes.ntUpdates.length === 0) return;

        const palettes = [
            nes.VRAM.slice(0x3f00, 0x3f04),
            nes.VRAM.slice(0x3f04, 0x3f08),
            nes.VRAM.slice(0x3f08, 0x3f0c),
            nes.VRAM.slice(0x3f0c, 0x3f10),
        ];

        background.style.backgroundColor = paletteHex[palettes[0][0]];

        for (let ntIndex = 0; ntIndex < nes.ntUpdates.length; ntIndex++) {
            const cursor = nes.ntUpdates[ntIndex];
            const x = xyLookup[cursor][0];
            const y = xyLookup[cursor][1];
            const tile = nes.VRAM[0x2000 + cursor];

            const attrIndex =
                Math.floor(x / 4) + (Math.floor(y / 4) * 8) + 0x23c0;
            const attr = nes.VRAM[attrIndex];
            const shift = ((x/2 & 1) * 2) + ((y/2 & 1) * 4);
            const paletteLine = (attr >> shift) & 0b11;
            const palette = palettes[paletteLine];

            const pixels = nes.tiles[tile + (nes.bus.chr0 * 0x100)];

            for (let i = 0; i < 64; i++) {
                const pixel = pixels[i];
                if (pixel !== 0) { // can ignore transparent pixels
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
        const { RAM, VRAM } = nes
        spCtx.clearRect(0, 0, sprites.width, sprites.height);
        const oam = [...RAM.slice(0x200, 0x300)];
        const palettes = [
            VRAM.slice(0x3f10, 0x3f14),
            VRAM.slice(0x3f14, 0x3f18),
            VRAM.slice(0x3f18, 0x3f1c),
            VRAM.slice(0x3f1c, 0x3f20),
        ];

        while (oam.length) {
            const [y, tile, attr, x] = oam.splice(0, 4);
            // assume attributes like this are bad
            if (tile !== 0xFF && tile !== 0xEF && x !== 0 && attr !== 0xFF) {
                const palette = palettes[attr & 0b11];
                const vflip = !!(attr & 0b1000000);

                const pixels = nes.tiles[tile + (nes.bus.chr0 * 0x100)];

                for (let i = 0; i < 64; i++) {
                    const pixel = pixels[vflip ? 63 - i : i];
                    if (pixel !== 0) { // can ignore transparent pixels
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
}
