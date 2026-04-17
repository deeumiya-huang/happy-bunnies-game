import { ctx, canvas, bgCtx, bgCanvas } from "./config.js";
import { EntityManager } from "./entity-manager.js";
import {gameBoard, gameHint, pauseBtn, startBtn, modeBtn, selectMode, singleBtn, doubleBtn} from "./main.js";

export class Game {
    constructor() {
        this.gameMode = 'double'; //can choose single or double
        this.isReady = false;  // Whether resources are fully loaded
        this.isRunning = false;
        this.isStarted = false; // Whether the game has been started via click
        this.entities = new EntityManager(1, this);
        this.keys = {};
        this.winnerTimer = null; // to reset life after the winner comes out
        this.winnerImg = document.createElement('img');
        this.winnerText = document.createElement('h3');
        this.drawText = document.createElement('h3');
    }

    init(onStart, onPause) {
        this.initWinnerUI(); // set default UI style and content.
        this.entities.setup();
        this.setupInput(onStart, onPause);
    }

    setupInput(onStart, onPause) {
        window.addEventListener('keydown', (e) => {
            // List of keys that trigger page scrolling
            const keysToBlock = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"];
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
        //reset players back to original place
        this.resetPlayers();

        const p1Dead = this.entities.player1.remainingLives <= 0;
        // in single mode, p2Dead is always true
        const p2Dead = this.gameMode === 'double' ? this.entities.player2.remainingLives <= 0 : true;
        if (p1Dead && p2Dead) {
            this.resetStatus();
        }
        this.isStarted = true;
        this.isRunning = true;
        // only player remaining lives is active
        this.entities.player1.active = this.entities.player1.remainingLives > 0;
        if (this.gameMode === 'double') {
            this.entities.player2.active = this.entities.player2.remainingLives > 0;
        } else {
            this.entities.player2.active = false; // in single mode, p2.active is always false
        }

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
    initWinnerUI() {
        this.winnerText.textContent = 'Winner:';
        this.winnerText.classList.add('game-hint');
        this.winnerText.style.fontSize = '1.8rem';
        this.winnerText.style.display = 'none'; // default setting

        this.winnerImg.classList.add('winner-img');
        this.winnerImg.style.display = 'none'; // default setting

        this.drawText.textContent = 'Draw!';
        this.drawText.classList.add('game-hint');
        this.drawText.style.display = 'none'; // default setting

        gameBoard.prepend(this.winnerImg);
        gameBoard.prepend(this.winnerText);
        gameBoard.prepend(this.drawText);
    }
    resetUI() {
        this.winnerText.style.display = 'none';
        this.winnerImg.style.display = 'none';
        this.drawText.style.display = 'none';
        selectMode.style.display = 'block';
        singleBtn.style.display = 'block';
        doubleBtn.style.display = 'block';
    }

    togglePause() {
        if (!this.isStarted) return;
        this.isRunning = !this.isRunning;
        this.entities.stopSpawning();
        if (this.isRunning) {
            // Resume Game: Restart Loop
            requestAnimationFrame((time) => this.loop(time));
            this.entities.startSpawningGroundEnemy();
            this.entities.startSpawningSkyEnemy();
            this.entities.startSpawningItem();
        }
    }

    resetPlayers() {
        const players = [this.entities.player1, this.entities.player2];

        const startPositions = [
            { x: 200, y: -150 },
            { x: 400, y: -150 }
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

    resetStatus() {
        this.resetLife();
        this.resetScore();
        this.entities.resetDifficulty();
        console.log(`Reset Level! Current Level: ${this.entities.level}, PlayerSpeed: ${this.entities.playerSpeed}, EnemySpeed: ${this.entities.enemySpeed}, ItemSpeed: ${this.entities.itemSpeed}`);
    }
    resetScore() {
        this.entities.player1.score = 0;
        this.entities.player2.score = 0;
        window.dispatchEvent(new CustomEvent('resetScoreUI'));
    }
    resetLife() {
        this.entities.player1.remainingLives = 3;
        this.entities.player2.remainingLives = 3;
        const containers = document.querySelectorAll('.player-lives');
        containers.forEach(container =>
        {
            while (container.children.length < 3) {
                const life = document.createElement('img');
                life.src = './src/assets/carrots.png';
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

    showWinner() {
        gameHint.style.display = 'none';

        if (this.gameMode === 'single') {
            this.drawText.textContent = `Game Over! Score: ${this.entities.player1.score}`;
            this.drawText.style.display = 'block';
        } else {
            // original double mode logic.
            const loser = this.findLoser();
            if (!loser) {
                this.drawText.style.display = 'block';
            } else {
                this.winnerText.style.display = 'block';
                this.winnerImg.style.display = 'block';
                if (loser.playerNumber === 1) {
                    this.winnerImg.src = './src/assets/bunny2_stand.png';
                } else {
                    this.winnerImg.src = './src/assets/bunny1_stand.png';
                }
            }
        }

        this.isStarted = false;
        modeBtn.style.display = 'block';
        startBtn.textContent = 'Play Again';

        const p1Score = this.entities.player1.score;
        const p2Score = this.entities.player2.score;
        const higherScore = Math.max(p1Score, p2Score);
        const finalHighScore = this.updateHighScore(higherScore);

        // update the highest score on webpage
        document.querySelector('#high-score-display').textContent = `High Score: ${finalHighScore}`;
    }
    findLoser() {
        if (this.entities.player1.score > this.entities.player2.score) {
            return this.entities.player2;
        } else if (this.entities.player1.score < this.entities.player2.score) {
            return this.entities.player1;
        } else {
            return null;
        }
    }

    updateHighScore(currentScore) {
        // read recorded the highest score from localStorage, if not, set default as 0.
        const savedHighScore = localStorage.getItem('bunny_high_score') || 0;

        if (currentScore > savedHighScore) {
            localStorage.setItem('bunny_high_score', currentScore);
            console.log(`new record! highest score：${currentScore}`);
            return currentScore;
        }
        return savedHighScore;
    }

    // each round finish will run this function, but the round end and total game over logic separate in this function
    gameOver() {
        this.isRunning = false;
        this.isStarted = false;
        this.entities.stopSpawning();
        this.entities.player1.active = false;
        this.entities.player2.active = false;
        this.entities.allEnemies.forEach(pool => {
            pool.forEach(e => {
                e.active = false;
            })
        })
        this.entities.items.forEach(item => {
            item.active = false;
        })
        gameBoard.style.display = 'flex';
        pauseBtn.style.display = 'none';
        pauseBtn.innerText = "Pause";
        selectMode.style.display = 'none';
        singleBtn.style.display = 'none';
        doubleBtn.style.display = 'none';
        modeBtn.style.display = 'none';
        // check player dead status
        const p1Dead = this.entities.player1.remainingLives <= 0;
        const p2Dead = this.gameMode === 'double' ? this.entities.player2.remainingLives <= 0 : true;

        if (p1Dead && p2Dead) {
            this.showWinner();
            console.log("All players dead. Final Result!");
        } else {
            gameHint.style.display = 'block';
            this.winnerImg.style.display = 'none';
            this.winnerText.style.display = 'none';
            startBtn.textContent = 'Next Round';
            console.log("A round ended. Preparing next round...");
        }

        this.entities.levelUp();
    }

}