export const canvas = document.querySelector('#mainCanvas');
export const ctx = canvas.getContext('2d');
export const bgCanvas = document.querySelector('#bgCanvas');
export const bgCtx = bgCanvas.getContext('2d');

export const GAME_SETTINGS = {
    gravity: 0.4,
    groundRatio: 0.18
};

export const POOL_SIZE = 10;
