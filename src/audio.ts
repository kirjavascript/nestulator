import NES from './nes';
import option from '../sfx/1.ogg';
import screen from '../sfx/2.ogg';
import shift from '../sfx/3.ogg';
import tetris from '../sfx/4.ogg';
import rotate from '../sfx/5.ogg';
import levelup from '../sfx/6.ogg';
import lock from '../sfx/7.ogg';
import clear from '../sfx/8.ogg';
import complete from '../sfx/9.ogg';

// @ts-ignore
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

const clips = [
    option,
    screen,
    shift,
    tetris,
    rotate,
    levelup,
    lock,
    shift, // 'chirp'
    clear,
    complete,
].map((clipView: Uint8Array) => {
    const clip: {
        getSource: () => AudioBufferSourceNode | undefined,
        source?: AudioBufferSourceNode,
    } = {
        getSource: () => {
            if (clip.source) {
                const { source } = clip;
                clip.source = undefined;
                createClip();
                return source;
            } else {
                console.error('dropped sound');
            }
        },
    };

    const createClip = () => {
        !clip.source && context.decodeAudioData(clipView.buffer.slice(0))
            .then(buffer => {
                const source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(context.destination);
                clip.source = source;
            })
            .catch(console.error);
    };

    createClip();

    return clip;
});

let currentSound: any;

export function playSFX(nes: NES) {
    if (nes.bus.sfx) {
        if (currentSound) {
            currentSound.stop();
            currentSound = null;
        }

        const source = clips[nes.bus.sfx - 1].getSource();
        if (source) {
            currentSound = source;
            currentSound.start();
        }

        nes.bus.sfx = 0;
    }
}
