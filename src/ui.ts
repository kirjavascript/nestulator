import NES from './nes';
import { remap } from './joypad';

export default function buildUI(nes: NES) {
    // load ROM from storage

    const rom = window.localStorage.getItem('ROM');
    if (rom?.length) {
        nes.setROM(Uint8Array.from(JSON.parse(rom)));
    }

    // change ROM

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

    // fullscreen

    const screen = document.querySelector('.screen') as HTMLDivElement
    function fullscreen() {
        screen.requestFullscreen().catch(console.error);
    }
    (document.querySelector('#fullscreen') as HTMLButtonElement)
        .addEventListener('click', fullscreen);
    screen.addEventListener('dblclick', fullscreen);

    // runahead

    const runaheadBox = document.querySelector('#runahead') as HTMLInputElement;
    runaheadBox.addEventListener('click', e => {
        nes.runahead = (e.target as HTMLInputElement).checked;
    });
    nes.runahead = runaheadBox.checked;

    // input mapping

    const controlText = document.querySelector('#controls') as HTMLParagraphElement;
    (document.querySelector('#input') as HTMLButtonElement)
        .addEventListener('click', () => {
            nes.running = false;
            remap({
                setText: (text) => {
                    controlText.textContent = text;
                },
                onComplete: () => {
                    controlText.textContent = '';
                    nes.running = true;
                },
            });
        });

    window.debug = () => {
        const debug = (document.querySelector('main') as HTMLElement)
            .appendChild(document.createElement('pre'));

        debug.style.position = 'absolute';
        debug.style.top = '0';
        debug.style.left = '0';
        debug.style.color = 'limegreen';

        function ram() {
            const lines = [];
            const d = [...nes.RAM];
            for (let cursor = 0; d.length; cursor += 16) {
                lines.push(
                    `0x${cursor.toString(16).padStart(4, '0')}: ` +
                        d
                    .splice(0, 16)
                    .map((d) => d.toString(16).padStart(2, '0'))
                    .join(','),
                );
            }
            debug.innerHTML = `PC: ${nes.cpu.state.p.toString(16)}\nframes: ${
                nes.bus.frames
            }\n${JSON.stringify(nes.cpu.state)}\n${lines.join('\n')}`;
        }

        const loop = () => {
            requestAnimationFrame(loop);
            ram();
        };
        loop();
        delete window.debug;
    };
}
