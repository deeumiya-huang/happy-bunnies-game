import { ctx, canvas, bgCtx, bgCanvas } from "./config.js";
import { EntityManager } from "./entity-manager.js";
import {gameBoard, gameHint, pauseBtn, startBtn} from "./main.js";

export class Game {
    constructor() {
        this.isReady = false;  // Whether resources are fully loaded
        this.isRunning = false;
        this.isStarted = false; // Whether the game has been started via click
        this.entities = new EntityManager(1, this);
        this.keys = {};
        this.winnerTimer = null; // to reset life after the winner comes out
        this.winnerImg = document.createElement('img');
        this.winnerText = document.createElement('h3');

    }

    init(onStart, onPause) {
        this.initWinnerUI(); // set default UI style and content.
        this.entities.setup();
        this.setupInput(onStart, onPause);
    }

    setupInput(onStart, onPause) {
        window.addEventListener('keydown', (e) => {
            // List of keys that trigger page scrolling
            const keysToBlock = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
            this.keys[e.code] = true;
            if (this.isRunning && keysToBlock.includes(e.code)) {
                // Prevent the default browser scrolling behavior when playing game
                e.preventDefault();
            }
            // Enter key pressed - triggering start button
            if (e.code === 'Enter' && this.isReady && !this.isStarted) {onStart();}
            // P key pressed - triggering pause button
            if (e.code === 'KeyP' && this.isStarted) {onPause();}
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        })

    }

    start() {
        if (this.winnerTimer) {
            clearTimeout(this.winnerTimer);
            this.winnerTimer = null;
        }
        if (!this.isReady || this.isStarted) return;// If resources aren't ready yet, or if the game has already started, do nothing
        if (this.entities.player1.remainingLives <= 0 || this.entities.player2.remainingLives <= 0) {
            this.resetLife();
            this.resetScore();
        }
        this.isStarted = true;
        this.isRunning = true;

        this.entities.player1.active = true;
        this.entities.player2.active = true;

        this.resetUI();
        // Start game loop and enemy spawning
        this.entities.startSpawningGroundEnemy();
        this.entities.startSpawningSkyEnemy();
        this.entities.startSpawningItem();
        this.loop();
    }

    loop() {
        // put request in first order can prevent game shutdown just because one frame is broken
        if (!this.isRunning) return;
        requestAnimationFrame((time) => this.loop(time));
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.entities.update(this.keys);
        this.entities.draw();
    }

    drawBackground(loadedAssets){
        if (!loadedAssets.bgImg) return;
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        bgCtx.drawImage(loadedAssets.bgImg, 0, 0, loadedAssets.bgImg.width, loadedAssets.bgImg.height - 100, 0, 0, canvas.width, canvas.height);
    }

    togglePause() {
        if (!this.isStarted) return;
        this.isRunning = !this.isRunning;

        if (this.isRunning) {
            // Resume Game: Restart Loop
            requestAnimationFrame((time) => this.loop(time));
            this.entities.startSpawningGroundEnemy();
            this.entities.startSpawningSkyEnemy();
            this.entities.startSpawningItem();
        }
    }

    resetLife() {
        this.entities.player1.remainingLives = 3;
        this.entities.player2.remainingLives = 3;
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
    reduceLife(playerId) {
        const livesContainer = document.querySelector(playerId);

        // Check if the container has any images left to avoid errors
        if (livesContainer.lastElementChild) {
            livesContainer.removeChild(livesContainer.lastElementChild);
        }
    }

    initWinnerUI() {
        this.winnerText.textContent = 'Winner:';
        this.winnerText.classList.add('game-hint');
        this.winnerText.style.fontSize = '1.8rem';
        this.winnerText.style.display = 'none'; // default setting

        this.winnerImg.classList.add('winner-img');
        this.winnerImg.style.display = 'none'; // default setting

        gameBoard.prepend(this.winnerImg);
        gameBoard.prepend(this.winnerText);
    }

    showWinner(loser) {
        gameHint.style.display = 'none';
        this.winnerText.style.display = 'block';
        this.winnerImg.style.display = 'block';

        if (loser.playerNumber === 1) {
            this.winnerImg.src = 'assets/bunny2_stand.png';
        } else {
            this.winnerImg.src = 'assets/bunny1_stand.png';
        }

        this.isStarted = false;
        startBtn.textContent = 'Play Again';
    }

    resetUI() {
        this.winnerText.style.display = 'none';
        this.winnerImg.style.display = 'none';
        gameHint.style.display = 'block';
    }

    resetPlayers() {
        const players = [this.entities.player1, this.entities.player2];

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

    resetScore() {
        this.entities.player1.score = 0;
        this.entities.player2.score = 0;
        window.dispatchEvent(new CustomEvent('resetScoreUI'));
    }
    gameOver() {
        this.isStarted = false;
        this.isRunning = false;
        this.entities.player1.active = false;
        this.entities.player2.active = false;
        this.entities.allEnemies.forEach(pool => {
            pool.forEach(e => {
                e.active = false;
            })
        })
        //reset players back, and take start button back
        this.resetPlayers();
        gameBoard.style.display = 'flex';
        pauseBtn.style.display = 'none';
        pauseBtn.innerText = "Pause";
        if (this.entities.player1.remainingLives === 0) {
            this.showWinner(this.entities.player1);
        } else if (this.entities.player2.remainingLives === 0) {
            this.showWinner(this.entities.player2);
        } else {
            gameHint.style.display = 'block';
            this.winnerImg.style.display = 'none';
            this.winnerText.style.display = 'none';
            startBtn.textContent = 'Start';
        }
        console.log("Game Over");
    }

}