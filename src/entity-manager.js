import {canvas, POOL_SIZE} from "./config.js";
import { Player } from "./player.js";
import { GroundEnemy, SkyEnemy } from "./enemy.js";
import { Item } from "./item.js";

export class EntityManager {
    constructor(level, game) {
        this.game = game;
        this.isSmallScreen = window.innerWidth < 800; // delay spawning enemy time on mobile prevent too crowded
        this.spawnDelayMultiplier = this.isSmallScreen ? 3.0 : 1.0;
        this.player1 = null;
        this.player2 = null;
        this.groundEnemies = [];
        this.skyEnemies = [];
        this.allEnemies = [this.groundEnemies, this.skyEnemies];
        this.items = [];
        this.level = level;
        this.playerSpeed = 1 + this.level / 2;
        this.enemySpeed = this.level / 2;
        this.itemSpeed = this.level / 2;
        this.spawnTimers = {
            ground: null,
            sky: null,
            item: null
        };
    }

    setup() {
        this.player1 = new Player(1,200, 300, this.playerSpeed, {left: 'KeyA', right: 'KeyD', jump: 'KeyW'});
        this.player2 = new Player(2,400, 300, this.playerSpeed, {left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp'});
        for (let i = 0; i < POOL_SIZE; i++) {
            this.groundEnemies.push(new GroundEnemy(this.enemySpeed));
            this.skyEnemies.push(new SkyEnemy(this.enemySpeed));
            this.items.push(new Item(this.itemSpeed));
        }
    }
    update(keys) {
        [this.player1, this.player2].forEach(player => {if (player.active) {player.update(keys);}})
        if (this.player1.animationFinished || this.player2.animationFinished) {this.game.gameOver()}
        this.allEnemies.forEach(pool =>{
            pool.forEach(enemy => {enemy.update()})
        })
        this.items.forEach(item => {item.update()})
        this.updateEnemyCollision();
        this.updateItemCollision();
        this.updatePlayerCollision();
    }

    levelUp() {
        this.level++;
        this.playerSpeed = 1 + this.level / 2;
        this.enemySpeed = this.level / 2;
        this.itemSpeed = this.level / 2;

        this.player1.speed = this.playerSpeed;
        this.player2.speed = this.playerSpeed;
        this.allEnemies.forEach(pool => {
            pool.forEach(enemy => {
                enemy.speed = this.enemySpeed;
                enemy.dx = -this.enemySpeed; // dx has to reset to new speed or the speed won't change.
            });
        });
        this.items.forEach((item => {
            item.speed = this.itemSpeed;
            item.dy = this.itemSpeed;
        }))
        console.log(`Level Up! Current Level: ${this.level}, PlayerSpeed: ${this.playerSpeed}, EnemySpeed: ${this.enemySpeed}, ItemSpeed: ${this.itemSpeed}`);
    }
    resetDifficulty() {
        this.level = 1; // back to default value
        this.enemySpeed = 0.5;
        this.enemySpeed = 0.5;
        this.playerSpeed = 1.5;

        // update all the entities speed
        this.player1.speed = this.playerSpeed;
        this.player2.speed = this.playerSpeed;
        this.allEnemies.forEach(pool => pool.forEach(e => e.speed = this.enemySpeed));
        this.items.forEach(item => {
            item.speed = this.itemSpeed;
        });
    }

    updateEnemyCollision() {
        const players = [this.player1, this.player2];
        // prevent redundant damage calculation
        if (this.player1.isInvincible || this.player2.isInvincible ||
            this.player1.state === 'hurt' || this.player2.state === 'hurt') {
            return;
        }

        for (const p of players) {
            for (const pool of this.allEnemies) {
                for (const e of pool) {
                    if (e.active && this.checkCollision(p.getHitbox(), e.getHitbox())) {
                        p.isHit = true;
                        p.remainingLives -= 1;
                        this.game.reduceLife(`#player${p.playerNumber}-lives`);
                        p.state = 'hurt';
                        p.dy = -10;

                        this.setOthersInvincible(p);
                        e.active = false;
                        // if anyone touched enemy, finished all the collision detection function immediately
                        return;
                    }
                }
            }
        }
    }
    updateItemCollision() {
        const players = [this.player1, this.player2];
        // when someone hurts, both players can't get score from carrots.
        if (this.player1.isInvincible || this.player2.isInvincible ||
            this.player1.state === 'hurt' || this.player2.state === 'hurt') {
            return;
        }
        for (const p of players) {
            this.items.forEach(item => {
                if (item.active && this.checkCollision(p.getHitbox(), item.getHitbox())) {
                    p.score += 1;
                    item.active = false;
                    // send self-defined event to main.js
                    window.dispatchEvent(new CustomEvent('updateScore', {
                        detail: { playerNum: p.playerNumber, score: p.score }
                    }));
                }
            })
        }
    }
    updatePlayerCollision() {
        if (this.checkCollision(this.player1.getHitbox(), this.player2.getHitbox())) {
            const bounce = 15; // Add some bounce when players collide

            if (this.player1.x < this.player2.x) {
                this.player1.dx = -bounce;
                this.player2.dx = bounce;
            } else {
                this.player1.dx = bounce;
                this.player2.dx = -bounce;
            }

            this.player1.x += this.player1.dx;
            this.player2.x += this.player2.dx;
        }
    }
    checkCollision(rect1, rect2) {
        return (
            rect1.x  < rect2.x + rect2.width  &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    setOthersInvincible(hitPlayer) {
        const players = [this.player1, this.player2];
        players.forEach(p => {
            if (p !== hitPlayer) {
                p.isInvincible = true;
                p.invincibilityTimer = 300;
            }
        });
    }
    
    draw() {
        this.allEnemies.forEach(pool => {
            pool.forEach(enemy => {
                enemy.draw();
            });
        });
        this.items.forEach(item => {
            item.draw();
        });
        [this.player1, this.player2].forEach(player => {player.draw()}) // player draw after enemy to prevent block by enemy

    }

    // keep spawning enemy in random time between 2-4s until game stop
    startSpawningGroundEnemy() {
        clearTimeout(this.spawnTimers.ground);
        if (!this.game.isRunning){ return;}
        //2000 - 4000 ms on computer
        const minTime = 2000 * this.spawnDelayMultiplier;
        const range = 2000 * this.spawnDelayMultiplier;
        const randomTime = Math.floor(Math.random() *range) + minTime;
        this.spawnTimers.ground = setTimeout(() => {
            this.spawnGroundEnemy();
            this.startSpawningGroundEnemy(); // recursive call for the next random interval
        }, randomTime);
    }
    startSpawningSkyEnemy() {
        clearTimeout(this.spawnTimers.sky);
        if (!this.game.isRunning){ return;}
        const minTime = 2000 * this.spawnDelayMultiplier;
        const range = 2000 * this.spawnDelayMultiplier;
        const randomTime = Math.floor(Math.random() *range) + minTime;        this.spawnTimers.sky = setTimeout(() => {
            this.spawnSkyEnemy();
            this.startSpawningSkyEnemy(); // recursive call for the next random interval
        }, randomTime);
    }
    startSpawningItem() {
        clearTimeout(this.spawnTimers.item);
        if (!this.game.isRunning){ return;}
        //1000 - 4000 ms
        const randomTime = Math.floor(Math.random() * 3000) + 1000;
        this.spawnTimers.item = setTimeout(() => {
            this.spawnItem();
            this.startSpawningItem(); // recursive call for the next random interval
        }, randomTime);
    }
    stopSpawning() {
        clearTimeout(this.spawnTimers.ground);
        clearTimeout(this.spawnTimers.sky);
        clearTimeout(this.spawnTimers.item);
    }
    spawnGroundEnemy() {
        const enemy = this.groundEnemies.find(e => e.active === false);
        if (enemy){
            enemy.active = true;
            enemy.x = canvas.width; // Enemy appear from right
        }
    }
    spawnSkyEnemy() {
        const enemy = this.skyEnemies.find(e => e.active === false);
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
    spawnItem() {
        const item = this.items.find(e => e.active === false);
        if (item){
            item.active = true;
            item.y = -50; // item appear from top
            item.x = Math.random() * (canvas.width - item.width);
        }
    }
}