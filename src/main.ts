import NES from './nes';
import buildUI from './ui';

// import * as PIXI from 'pixi.js'

// const { view, renderer } = new PIXI.Application({
//     width: 256,
//     height: 240,
//     antialias: true,
//     backgroundAlpha: 0,
//     resolution: 1,
// });
// document.body.appendChild(view);
// Object.assign(renderer.view.style, {
//     position: 'absolute',
//     display: 'block',
//     top: 0,
//     left: 0,
// });

// const stage = new PIXI.Container();

// const debug = new PIXI.Text('', {
//     fontFamily: 'monospace',
//     fontSize: 12,
//     align: 'center',
// });
// debug.anchor.set(0, 1);
// debug.text = 'test'
// debug.position.set(10, 50);
// stage.addChild(debug);

// TODO: fix eric's/erens issue
// TODO: detect rocket screen, swap layers
// TODO: video recording
// TODO: QR at end of game
// TODO: anticheat: https://www.youtube.com/watch?v=mwTzNwp4tHY
// TODO: recording (per game) / playback
// perf ideas: (tile caching, nametable write directly to UI, webgl, reduced cpu)
// https://web.archive.org/web/20210714180839/http://snk.digibase.ca/tetrisroms/NTSC.nes

const nes = new NES();
window.nes = nes;

buildUI(nes);

// nes.framerate = 0.005;

const frameCount = document.querySelector('.frameCount') as HTMLSpanElement;
const epoch = performance.now();
let framesDone = 0;
const loop = () => {
    requestAnimationFrame(loop);

    // renderer.render(stage);

    const diff = performance.now() - epoch;
    const frames = diff * nes.framerate | 0;
    const frameAmount = frames - framesDone;
    frameCount.textContent = String(frameAmount);

    if (nes.running && document.visibilityState !== 'hidden') {
        if (frameAmount > 5) {
            nes.frame(true);
        } else {
            for (let i = 0; i < frameAmount; i++) {
                nes.frame(i === frameAmount - 1);
            }
        }
    }
    framesDone = frames;
};
loop();
