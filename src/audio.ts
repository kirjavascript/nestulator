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
        source?: AudioBufferSourceNode,
        createSource: (callback?: (source: AudioBufferSourceNode) => void) => void,
    } = {
        createSource: (callback?: (source: AudioBufferSourceNode) => void) => {
            !clip.source && context.decodeAudioData(clipView.buffer.slice(0))
            .then(buffer => {
                const source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(context.destination);
                if (callback) {
                    callback(source);
                } else {
                    clip.source = source;
                }
            })
            .catch(console.error);
        }
    };

    clip.createSource();

    return clip;
});

let currentSound: any;

export function playSFX(nes: NES) {
    if (nes.bus.sfx) {
        if (currentSound) {
            currentSound.stop();
            currentSound = null;
        }

        const clip = clips[nes.bus.sfx - 1];
        if (clip.source) {
            const { source } = clip;
            clip.source = undefined;
            currentSound = source;
            source.start();
            clip.createSource();
        } else {
            console.warn(`sound ${nes.bus.sfx} wasn't cached`);
            clip.createSource(source => {
                currentSound = source
                source.start();
            });
        }

        nes.bus.sfx = 0;
    }
}
