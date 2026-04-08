export const canvas = document.querySelector('#mainCanvas');
export const ctx = canvas.getContext('2d');

export const GAME_SETTINGS = {
    gravity: 0.4,
    groundLevel: 125
};

export const POOL_SIZE = 10;
export const LEVELS = {
    level1: { playerSpeed: 2, enemySpeed: 1, spawnGroundTime: 4000, spawnSkyTime: 4000},
    level2: {},
    level3: {},
    level4: {},
    level5: {}
}