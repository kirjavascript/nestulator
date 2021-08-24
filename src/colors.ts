import palFile from '../Smooth (FBX).pal';

const palette = [...palFile];
const paletteRGB: Array<Array<number>> = [];

while (palette.length) {
    paletteRGB.push(palette.splice(0, 3));
}

export { paletteRGB };

export const paletteHex = paletteRGB.map(color => (
    '#' + color.map((n: number) => n.toString(16).padStart(2, '0')).join('')
));
