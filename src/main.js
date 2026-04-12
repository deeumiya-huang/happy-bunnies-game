import {canvas, bgCanvas} from "./config.js";
import { loadedAssets, initAssets } from "./asset-loader.js";
import { Game } from "./game.js";

const game = new Game();
export const startBtn = document.querySelector('#game-start');
export const pauseBtn = document.querySelector('#game-pause');
export const gameBoard = document.querySelector('#game-board');
export const gameHint = document.querySelector('.game-hint');

// drawing background is included in resize function, consider carefully when modify resize function
function resize() {
    const {width, height} = bgCanvas.parentElement.getBoundingClientRect();
    [bgCanvas, canvas].forEach(c => {
        c.width = width;
        c.height = height;
    });
    if (game && game.isReady){
        game.drawBackground(loadedAssets);
    }
}
async function boot() {
    await initAssets(); // wait important resource loaded and start to play game.
    resize(); // decide canvas' width and height first to let all the entity get correct x/y
    // initialize game and bind keyboard input onto button click
    game.init(
        () => startBtn.click(),
        () => pauseBtn.click()
    );
    game.isReady = true;
    console.log(`game initialize!`);

    startBtn.addEventListener('click', () => {
        gameBoard.style.display = 'none';
        gameHint.style.display = 'block';
        pauseBtn.style.display = 'inline-block';
        game.start();
        console.log("Game Started!");
    });

    pauseBtn.addEventListener('click', () => {
        game.togglePause(); // Toggle running state

        if (game.isRunning) {
            pauseBtn.innerText = "Pause";
        } else {
            pauseBtn.innerText = "Resume";
        }
    });
}

window.addEventListener('resize', resize);

boot();