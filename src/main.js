import {canvas, bgCanvas} from "./config.js";
import { loadedAssets, initAssets } from "./asset-loader.js";
import { Game } from "./game.js";

const game = new Game();
export const singleBtn = document.querySelector('#single-mode');
export const dualBtn = document.querySelector('#dual-mode');
export const selectMode = document.querySelector('#select-mode');
export const startBtn = document.querySelector('#game-start');
export const pauseBtn = document.querySelector('#game-pause');
export const modeBtn = document.querySelector('#change-mode');
export const gameBoard = document.querySelector('#game-board');
export const gameHint = document.querySelector('#hint');
const modeName = document.querySelector('#mode-name');
const player2Display = document.querySelector('#player2-wrapper');

const fullscreenBtn = document.querySelector('#fullscreen-btn');
const gameContainer = document.querySelector('#game-container');
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
function handleMobileRestriction() {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // mobile can only play single mode
        game.gameMode = 'single';
        modeName.textContent = 'Single Mode (Mobile Optimized)';
        player2Display.style.visibility = 'hidden';

        // hide dual mode btn
        modeBtn.style.display = 'none';
        dualBtn.style.display = 'none';

        selectMode.textContent = "Mobile version: Single Player only";
    }
}
function setupMobileControls() {
    const btnLeft = document.querySelector('#btn-left');
    const btnRight = document.querySelector('#btn-right');
    const btnJump = document.querySelector('#btn-jump');

    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault(); // intercept the browser's default behavior
        btnLeft.classList.add('is-active');
        game.keys['KeyA'] = true;
    }, {passive: false})
    btnLeft.addEventListener('touchend', () => {
        btnLeft.classList.remove('is-active');
        game.keys['KeyA'] = false;
    });

    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btnRight.classList.add('is-active');
        game.keys['KeyD'] = true;
    });
    btnRight.addEventListener('touchend', () => {
        game.keys['KeyD'] = false;
        btnRight.classList.remove('is-active');
    });

    btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btnJump.classList.add('is-active');
        game.keys['KeyW'] = true;
    });
    btnJump.addEventListener('touchend', () => {
        game.keys['KeyW'] = false;
        btnJump.classList.remove('is-active');
    });
}
function displayInitialHighScore() {
    const highScore = localStorage.getItem('bunny_high_score') || 0;
    const highScoreElement = document.querySelector('#high-score-display');
    if (highScoreElement) {
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
}
function setUpDisplay() {
    modeName.style.display = 'block';
    singleBtn.style.display = 'none';
    dualBtn.style.display = 'none';
    selectMode.style.display = 'none';
    modeName.style.display = 'block';
    gameHint.style.display = 'block';
    startBtn.style.display = 'block';
}
async function boot() {
    await initAssets(); // wait important resource loaded and start to play game.
    game.isReady = true;

    handleMobileRestriction();
    resize(); // decide canvas' width and height first to let all the entity get correct x/y
    // initialize game and bind keyboard input onto button click
    displayInitialHighScore();
    game.init(
        () => startBtn.click(),
        () => pauseBtn.click()
    );

    console.log(`game initialize!`);

    setupMobileControls();

    singleBtn.addEventListener('click', () => {
        game.gameMode = 'single';
        modeName.textContent = 'Single Mode';
        player2Display.style.visibility = 'hidden';
        setUpDisplay();
    })

    dualBtn.addEventListener('click', () => {
        game.gameMode = 'dual';
        modeName.textContent = 'Dual Mode';
        player2Display.style.visibility = 'visible';
        setUpDisplay();
    })

    startBtn.addEventListener('click', () => {
        gameBoard.style.display = 'none';
        modeName.style.display = 'none';
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

    modeBtn.addEventListener('click', () => {
        gameHint.style.display = 'block';

        if (game.gameMode === 'single') {
            game.gameMode = 'dual';
            modeName.textContent = 'Dual Mode';
            player2Display.style.visibility = 'visible';
        } else {
            game.gameMode = 'single';
            modeName.textContent = 'Single Mode';
            player2Display.style.visibility = 'hidden';
        }
        modeName.style.display = 'block';
        modeBtn.style.display = 'none';
        startBtn.textContent = 'game start!';

        game.resetStatus();

        game.drawText.style.display = 'none';
        game.winnerText.style.display = 'none';
        game.winnerImg.style.display = 'none';
    })

    window.addEventListener('updateScore', (e) => {
        const { playerNum, score } = e.detail;
        const scoreElement = document.querySelector(`#player${playerNum}-score`);
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    })
    window.addEventListener('resetScoreUI', () => {
        document.querySelector('#player1-score').textContent = '0';
        document.querySelector('#player2-score').textContent = '0';
    });
}

window.addEventListener('resize', () => {
    handleMobileRestriction();
    resize();
});

fullscreenBtn.addEventListener('click', async (e) => {
    e.currentTarget.blur();
    try {
        if (!document.fullscreenElement) {
            // Enter fullscreen mode for the game container
            await gameContainer.requestFullscreen();

            // Attempt to lock screen orientation to landscape
            // ps. Some browsers require the page to be in fullscreen to lock orientation
            if (screen.orientation?.lock) {
                await screen.orientation.lock('landscape').catch(err => {
                    console.log("Orientation lock failed (device might not support it):", err);
                });
            }

            fullscreenBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 10V4h2v2.59l3.29-3.29l1.41 1.41L17.41 8H20v2zM4 10V8h2.59l-3.3-3.29l1.42-1.42L8 6.59V4h2v6zm16 4v2h-2.59l3.29 3.29l-1.41 1.41L16 17.41V20h-2v-6zm-10 0v6H8v-2.59l-3.29 3.3l-1.42-1.42L6.59 16H4v-2z"/></svg>`;
        } else {
            // 3. Exit fullscreen mode
            if (screen.orientation?.unlock) {
                screen.orientation.unlock(); // Unlock the orientation
            }
            await document.exitFullscreen();
            fullscreenBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="square" stroke-width="2" d="M5.884 5.884L9 9m0-4H5v4m.884 9.116L9 15m-4 0v4h4m9.116-13.116L15 9m0-4h4v4m-.884 9.116L15 15m4 0v4h-4"/></svg>`;
        }
    } catch (err) { // check which kind of error happened
        if (err.name === 'NotAllowedError') {
            console.error("User denied permissions or didn't click the button.");
        } else if (err.name === 'TypeError') {
            console.error("The browser doesn't support this feature.");
        } else {
            console.error(`An unexpected error occurred: ${err.message}`);
        }
    }
});
// listen for fullscreen change events (updates button text when Esc is pressed).
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        fullscreenBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="square" stroke-width="2" d="M5.884 5.884L9 9m0-4H5v4m.884 9.116L9 15m-4 0v4h4m9.116-13.116L15 9m0-4h4v4m-.884 9.116L15 15m4 0v4h-4"/></svg>`;
        // trigger resize to ensure canvas dimensions are correct after exiting fullscreen.
        resize();
    }
});

boot();