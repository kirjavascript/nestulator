import NES from './nes';
import { remap, gamepads } from './joypad';
import { hasDebug } from './search-params';

export default function buildUI(nes: NES) {
    // load ROM from storage

    const rom = window.localStorage.getItem('ROM');
    if (rom?.length) {
        nes.setROM(Uint8Array.from(JSON.parse(rom)));
    }

    // change ROM

    (document.querySelector('#file') as HTMLInputElement).addEventListener(
        'change',
        (e: any) => {
            const reader = new FileReader();
            reader.readAsArrayBuffer(e.target.files[0]);
            reader.onloadend = () => {
                // @ts-ignore
                const rom = new Uint8Array(reader.result);
                nes.setROM(rom);
                window.localStorage.setItem('ROM', JSON.stringify([...rom]));
            };
            e.preventDefault();
        },
    );

    // fullscreen

    const screen = document.querySelector('.screen') as HTMLDivElement;
    function fullscreen() {
        screen.requestFullscreen().catch(console.error);
    }
    (
        document.querySelector('#fullscreen') as HTMLButtonElement
    ).addEventListener('click', fullscreen);
    screen.addEventListener('dblclick', fullscreen);

    // runahead

    const runaheadBox = document.querySelector('#runahead') as HTMLInputElement;
    runaheadBox.addEventListener('click', (e) => {
        nes.runahead = (e.target as HTMLInputElement).checked;
    });
    nes.runahead = runaheadBox.checked;

    // sfx
    const sfxBox = document.querySelector('#sfx') as HTMLInputElement;
    sfxBox.addEventListener('click', (e) => {
        nes.sfxEnabled = (e.target as HTMLInputElement).checked;
    });
    nes.sfxEnabled = sfxBox.checked;

    // input mapping

    const controlText = document.querySelector(
        '#controls',
    ) as HTMLParagraphElement;
    (document.querySelector('#input') as HTMLButtonElement).addEventListener(
        'click',
        () => {
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
        },
    );

    if (hasDebug) {
        const debug = (
            document.querySelector('main') as HTMLElement
        ).appendChild(document.createElement('pre'));

        debug.style.position = 'absolute';
        debug.style.top = '0';
        debug.style.left = '0';
        debug.style.color = 'limegreen';
        debug.style.pointerEvents = 'none';

        function render() {
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
            debug.innerHTML = `
frames: ${nes.bus.frames} PC: ${nes.cpu.state.p.toString(16)}
${JSON.stringify(nes.cpu.state)}
${JSON.stringify(
    gamepads.map((gp) => [
        gp.buttons.map((b) => `P: ${b.pressed} V: ${b.value} T ${b.touched}`),
        gp.axes,
    ]),
    null,
    4,
)}
${lines.join('\n')}
            `.trim();
        }

        const loop = () => {
            requestAnimationFrame(loop);
            render();
        };
        loop();
    }
}
