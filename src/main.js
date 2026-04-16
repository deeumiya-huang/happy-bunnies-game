import {canvas, bgCanvas} from "./config.js";
import { loadedAssets, initAssets } from "./asset-loader.js";
import { Game } from "./game.js";

const game = new Game();
export const singleBtn = document.querySelector('#single-mode');
export const doubleBtn = document.querySelector('#double-mode');
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

        // hide double mode btn
        modeBtn.style.display = 'none';
        doubleBtn.style.display = 'none';

        selectMode.textContent = "Mobile version: Single Player only";
    }
}
function setupMobileControls() {
    const btnLeft = document.querySelector('#btn-left');
    const btnRight = document.querySelector('#btn-right');
    const btnJump = document.querySelector('#btn-jump');

    btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault(); // intercept the browser's default behavior
        game.keys['keyA'] = true;
    }, {passive: false})
    btnLeft.addEventListener('touchend', () => {
        game.keys['KeyA'] = false;
    });

    btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.keys['KeyD'] = true;
    });
    btnRight.addEventListener('touchend', () => {
        game.keys['KeyD'] = false;
    });

    btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        game.keys['KeyW'] = true;
    });
    btnJump.addEventListener('touchend', () => {
        game.keys['KeyW'] = false;
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
    doubleBtn.style.display = 'none';
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

    doubleBtn.addEventListener('click', () => {
        game.gameMode = 'double';
        modeName.textContent = 'Double Mode';
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
            game.gameMode = 'double';
            modeName.textContent = 'Double Mode';
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

            fullscreenBtn.textContent = "Exit Fullscreen";
        } else {
            // 3. Exit fullscreen mode
            if (screen.orientation?.unlock) {
                screen.orientation.unlock(); // Unlock the orientation
            }
            await document.exitFullscreen();
            fullscreenBtn.textContent = "Go Fullscreen";
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
        fullscreenBtn.textContent = "Go Fullscreen";
        // trigger resize to ensure canvas dimensions are correct after exiting fullscreen.
        resize();
    }
});

boot();