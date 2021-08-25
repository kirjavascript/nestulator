import NES from './nes';
// import

export function playSFX(nes: NES) {
    const sfx = nes.RAM[0x6F9]; // slot 1 sound effect playing
    // console.log(['nothing', 'option', 'screen', 'shift', 'tetris', 'rotate', 'levelup', 'lock', 'chirp?', 'clear', 'complete'][sfx])

}
