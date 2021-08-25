import NES from './nes';
import option from '../SFX/1.ogg';

// @ts-ignore
window.AudioContext = window.AudioContext || window.webkitAudioContext;

// async function play() {
//     const context = new AudioContext();
//     const buffer = await context.decodeAudioData(option.buffer.slice(0));
//     const source = context.createBufferSource();
//     source.buffer = buffer;
//     source.connect(context.destination);
//     source.start();
// }
const context = new AudioContext();

const clips = [option].map((clipView: Uint8Array) => {
    const clip = {
        playing: false,
        play: () => {
            if (!clip.playing && clip.source) {
                clip.playing = true;
                clip.source.start();
                console.log('play');
            }
        },
    };

    const createClip = (callback?: () => void) => {
        if (typeof AudioContext !== 'undefined') {
            context.decodeAudioData(clipView.buffer.slice(0))
                .then(buffer => {
                    callback?.();
                    const source = context.createBufferSource();
                    source.buffer = buffer;
                    source.connect(context.destination);
                    clip.source = source;
                    source.addEventListener('ended', (done) => {
                        createClip(() => {
                            clip.playing = false;
                        })
                    });
                })
                .catch(console.error);

        }
    };

    createClip();

    return clip;
});

export function playSFX(nes: NES) {

    const sfx = nes.RAM[0x6F9]; // slot 1 sound effect playing

    if (sfx) {
        // console.log(['nothing', 'option', 'screen', 'shift', 'tetris', 'rotate', 'levelup', 'lock', 'chirp?', 'clear', 'complete'][sfx])
        // play();
        // clips[0].source.start(0, 3);
        // clips[0].source.stop();
        clips[0].play();
        console.log(sfx);
    }
}
