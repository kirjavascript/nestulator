import NES from './nes';

export default function buildUI(nes: NES) {
    const rom = window.localStorage.getItem('ROM');
    if (rom?.length) {
        nes.setROM(Uint8Array.from(JSON.parse(rom)));
    }

    (document.querySelector('#fullscreen') as HTMLButtonElement)
        .addEventListener('click', () => {
            (document.querySelector('.screen') as HTMLDivElement)
            .requestFullscreen()
            .catch(console.error);
        });

    (document.querySelector('#file') as HTMLInputElement)
        .addEventListener('change', (e: any) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(e.target.files[0]);
            reader.onloadend = () => {
                // @ts-ignore
                const rom = new Uint8Array(reader.result);
                nes.setROM(rom);
                window.localStorage.setItem('ROM', JSON.stringify([...rom]));
            };
            e.preventDefault();
        });

    const runaheadBox = document.querySelector('#runahead') as HTMLInputElement;
    runaheadBox.addEventListener('click', e => {
        nes.runahead = (e.target as HTMLInputElement).checked;
    });
    nes.runahead = runaheadBox.checked;
}

// DEBUG

// const debug = document.body.appendChild(document.createElement('pre'));

// export function debugRAM() {
//     const lines = [];
//     const d = [...RAM];
//     for (let cursor = 0; d.length; cursor += 16) {
//         lines.push(
//             `0x${cursor.toString(16).padStart(4, '0')}: ` +
//                 d
//                     .splice(0, 16)
//                     .map((d) => d.toString(16).padStart(2, '0'))
//                     .join(','),
//         );
//     }
//     debug.innerHTML = `PC: ${cpu.state.p.toString(16)}\nframes: ${
//         bus.frames
//     }\n${lines.join('\n')}`;
// }

// const paletteDebug = document.body.appendChild(document.createElement('div'));
// paletteDebug.style.display = 'flex';

// paletteDebug.innerHTML = '';
// palettes
//     .map((d) => Array.from(d))
//     .flat()
//     .forEach((color) => {
//         const box = document.createElement('div');
//         box.textContent = color.toString(16);
//         box.style.backgroundColor = paletteHex[color];
//         paletteDebug.appendChild(box);
//     });
