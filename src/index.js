import {canvas, ctx, POOL_SIZE} from "./config.js";
import { Player } from "./player.js";
import { GroundEnemy, SkyEnemy } from "./enemy.js";
import { loadedAssets, initAssets} from "./asset-loader.js";

const bgCanvas = document.querySelector('#bgCanvas');
const bgCtx = bgCanvas.getContext('2d');

let isGameInitialized = false; // Whether resources are fully loaded (formerly isGameInitialized)
let isGameStarted = false; // Whether the game has been started via click
let isGameRunning = false;

const startBtn = document.querySelector('#game-start');
const pauseBtn = document.querySelector('#game-pause');
const gameBoard = document.querySelector('#game-board');
const gameHint = document.querySelector('.game-hint');
let winnerImg = document.createElement('img');
let winnerText = document.createElement('h3');

const keys = {};

let player1, player2;
let groundEnemies = [];
let skyEnemies = [];
const allEnemies = [groundEnemies, skyEnemies];

let level = 1;
let playerSpeed = 1 + level;
let enemySpeed = level;

let winnerTimer = null; // to reset life after the winner comes out

window.addEventListener('keydown', (e) => {
    // List of keys that trigger page scrolling
    const keysToBlock = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    keys[e.code] = true;
    if (isGameRunning && keysToBlock.includes(e.code)) {
        // Prevent the default browser scrolling behavior when playing game
        e.preventDefault();
    }
    // Enter key pressed - triggering start button
    if (e.code === 'Enter' && isGameInitialized && !isGameStarted) {startBtn.click();}
    // P key pressed - triggering pause button
    if (e.code === 'KeyP' && isGameStarted) {pauseBtn.click();}
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
})



// drawing background is included in resize function, consider carefully when modify resize function
function resize() {
    const {width, height} = bgCanvas.parentElement.getBoundingClientRect();
    [bgCanvas, canvas].forEach(c => {
        c.width = width;
        c.height = height;
    });
    if (isGameInitialized){
        drawBackground();
    }
}
function drawBackground(){
    bgCtx.drawImage(loadedAssets.bgImg, 0, 0, loadedAssets.bgImg.width, loadedAssets.bgImg.height - 100, 0, 0, canvas.width, canvas.height);
}

function setupEntities() {
    player1 = new Player(1,300, 300, playerSpeed, {left: 'KeyA', right: 'KeyD', jump: 'KeyW'});
    player2 = new Player(2,400, 300, playerSpeed, {left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp'});
    for (let i = 0; i < POOL_SIZE; i++) {
        let enemy = new GroundEnemy(enemySpeed);
        enemy.active = false;
        groundEnemies.push(enemy);
    }
    for (let i = 0; i < POOL_SIZE; i++) {
        let enemy = new SkyEnemy(enemySpeed);
        enemy.active = false;
        skyEnemies.push(enemy);
    }
}
function spawnGroundEnemy() {
    const enemy = groundEnemies.find(e => e.active === false);
    if (enemy){
        enemy.active = true;
        enemy.x = canvas.width; // Enemy appear from right
    }
}
function spawnSkyEnemy() {
    const enemy = skyEnemies.find(e => e.active === false);
    if (enemy){
        enemy.active = true;
        enemy.x = canvas.width; // Enemy appear from right

        // get those random feature back if we want to make this game more difficult
        // enemy.baseY = Math.random() * 100 + 300; // randomize flight height
        //
        // // randomize initial angle so enemies don't wobble in the same way
        // enemy.angle = Math.random() * Math.PI * 2;
        //
        // // randomize oscillation frequency and amplitude
        // enemy.angleSpeed = 0.04 + Math.random() * 0.04;
        // enemy.amplitude = 20 + Math.random() * 20;
    }
}

// keep spawning enemy in random time between 1-3s until game stop
function startSpawningGroundEnemy() {
    if (!isGameRunning){ return;}
    //1000 - 4000 ms
    const randomTime = Math.floor(Math.random() * 3000) + 1000;
    setTimeout(() => {
        spawnGroundEnemy();
        startSpawningGroundEnemy(); // recursive call for the next random interval
    }, randomTime);
}
function startSpawningSkyEnemy() {
    if (!isGameRunning){ return;}
    //1000 - 4000 ms
    const randomTime = Math.floor(Math.random() * 3000) + 1000;
    setTimeout(() => {
        spawnSkyEnemy();
        startSpawningSkyEnemy(); // recursive call for the next random interval
    }, randomTime);
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x  < rect2.x + rect2.width  &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function updateEnemyCollision() {
    const players = [player1, player2];
    for (const p of players) {
        // prevent redundant damage calculation
        if (p.isHit || p.isInvincible || p.state === 'hurt') continue;

        for (const pool of allEnemies) {
            for (const e of pool) {
                if (e.active && checkCollision(p.getHitbox(), e.getHitbox())) {
                    p.isHit = true;
                    p.remainingLives -= 1;
                    reduceLife(`#player${p.playerNumber}-lives`);
                    p.state = 'hurt';
                    p.dy = -10;

                    setOthersInvincible(p);
                    // if anyone touched enemy, finished all the collision detection function immediately
                    return;
                }
            }
        }
    }
}
function showWinner(Loser) {
    // gameBoard.style.display = 'flex';
    gameHint.style.display = 'none';
    winnerText.style.display = 'block';
    winnerImg.style.display = 'block';

    winnerText.textContent = 'Winner:';
    winnerText.classList.add('game-hint');
    winnerText.style.fontSize = '1.8rem';
    if (Loser.playerNumber === 1) {
        console.log('player2 wins!')
        winnerImg.src = 'assets/bunny2_stand.png';
    } else {
        console.log('player1 wins!');
        winnerImg.src = 'assets/bunny1_stand.png';
    }
    winnerImg.classList.add('winner-img');
    // prevent
    if (!gameBoard.contains(winnerImg)) {
        gameBoard.prepend(winnerImg);
        gameBoard.prepend(winnerText);
    }
    isGameStarted = false;
    startBtn.textContent = 'Play Again';
}

function resetLife() {
    player1.remainingLives = 3;
    player2.remainingLives = 3;
    const containers = document.querySelectorAll('.player-lives');
    containers.forEach(container =>
    {
        while (container.children.length < 3) {
            const life = document.createElement('img');
            life.src = 'assets/carrots.png';
            life.alt = 'player lives pattern';
            container.appendChild(life);
        }
    })
}
function reduceLife(playerId) {
    const livesContainer = document.querySelector(playerId);

    // Check if the container has any images left to avoid errors
    if (livesContainer.lastElementChild) {
        livesContainer.removeChild(livesContainer.lastElementChild);
    }
}
function setOthersInvincible(hitPlayer) {
    const players = [player1, player2];
    players.forEach(p => {
        if (p !== hitPlayer) {
            p.isInvincible = true;
            p.invincibilityTimer = 300;
        }
    });
}
function gameOver() {
    isGameStarted = false;
    isGameRunning = false;
    player1.active = false;
    player2.active = false;
    allEnemies.forEach(pool => {
        pool.forEach(e => {
            e.active = false;
        })
    })
    //reset players back, and take start button back
    resetPlayers();
    gameBoard.style.display = 'flex';
    pauseBtn.style.display = 'none';
    pauseBtn.innerText = "Pause";
    if (player1.remainingLives === 0) {
        showWinner(player1);
    } else if (player2.remainingLives === 0) {
        showWinner(player2);
    } else {
        gameHint.style.display = 'block';
        winnerImg.style.display = 'none';
        winnerText.style.display = 'none';
        startBtn.textContent = 'Start';
    }


    console.log("Game Over - System Reset Ready");
}
function resetPlayers() {
    const players = [player1, player2];

    // P1(300,300), P2(400,300)
    const startPositions = [
        { x: 300, y: 300 },
        { x: 400, y: 300 }
    ];

    players.forEach((p, index) => {
        p.isHit = false;
        p.isInvincible = false;
        p.animationFinished = false; // reset game over animation
        p.invincibilityTimer = 0;
        p.alpha = 1;
        p.state = 'stop';            // back to stand position
        p.deathCounter = 0;          // reset timer

        // back to start position
        p.x = startPositions[index].x;
        p.y = startPositions[index].y;
        p.dy = 0;
        p.dx = 0;
    });
}
function updatePlayerCollision() {
    if (checkCollision(player1.getHitbox(), player2.getHitbox())) {
        const bounce = 15; // Add some bounce when players collide

        if (player1.x < player2.x) {
            player1.dx = -bounce;
            player2.dx = bounce;
        } else {
            player1.dx = bounce;
            player2.dx = -bounce;
        }

        player1.x += player1.dx;
        player2.x += player2.dx;
    }
}



function gameLoop(){
    // put request in first order can prevent game shutdown just because one frame is broken
    if (!isGameRunning) {return;}
    requestAnimationFrame(gameLoop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    [player1, player2].forEach(player => {player.update(keys)})
    if (player1.animationFinished || player2.animationFinished) {gameOver()}
    allEnemies.forEach(pool =>{
        pool.forEach(enemy => {enemy.update()})
    })
    updateEnemyCollision();
    updatePlayerCollision();

    allEnemies.forEach(pool => {
        pool.forEach(enemy => {
                enemy.draw();
            });
    });
    [player1, player2].forEach(player => {player.draw()}) // player draw after enemy to prevent block by enemy
}

window.addEventListener('resize', resize);

// --- Initial Load (Executes on page load to display the background) ---
initAssets()
    .then(() => {
        isGameInitialized = true;

        resize(); // decide canvas' width and height first to let all the entity get correct x/y
        setupEntities(); // new all enemy after img loaded successfully
        console.log(`game initialize!`);
    })
    .catch((err) => console.error(`sth accidentally wrong!`, err));

// --- Start Button Logic ---
startBtn.addEventListener('click', () => {
    if (winnerTimer) clearTimeout(winnerTimer);
    if (!isGameInitialized || isGameStarted) return;// If resources aren't ready yet, or if the game has already started, do nothing
    if (player1.remainingLives <= 0 || player2.remainingLives <= 0) {
        resetLife();
    }
    isGameStarted = true; // Mark as started
    isGameRunning = true; // Mark as running

    player1.active = true;
    player2.active = true;
    gameBoard.style.display = 'none';
    gameHint.style.display = 'block';
    pauseBtn.style.display = 'inline-block';

    // Start game loop and enemy spawning
    startSpawningGroundEnemy();
    startSpawningSkyEnemy();
    requestAnimationFrame(gameLoop);

    console.log("Game Started!");
});

//--- Pause/Resume Button Logic ---
pauseBtn.addEventListener('click', () => {
    if (!isGameStarted) return;

    isGameRunning = !isGameRunning; // Toggle running state

    if (isGameRunning) {
        pauseBtn.innerText = "Pause";
        // Restart all interrupted loops/cycles
        requestAnimationFrame(gameLoop);
        startSpawningGroundEnemy();
        startSpawningSkyEnemy();
    } else {
        pauseBtn.innerText = "Resume";
    }
});
