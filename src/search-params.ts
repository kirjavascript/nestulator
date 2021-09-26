const params = new URLSearchParams(window.location.search);

export const zap = params.has('zap');
export const noflash = params.has('noflash');
export const pieces = [...(params.get('pieces') ?? '').toUpperCase()];
