import {canvas, ctx, POOL_SIZE} from "./config.js";
import { Player } from "./player.js";
import { GroundEnemy, SkyEnemy } from "./enemy.js";

const bgCanvas = document.querySelector('#bgCanvas');
const bgCtx = bgCanvas.getContext('2d');


const Assets = {
    BACKGROUND: './assets/backgroundColorForest.png',
    SPRITE_SHEET: './assets/spritesheet_jumper.png'
};

function loadImage(src){
    return new Promise((resolve, reject) =>{
        const img = new Image();
        img.addEventListener('load', () => {
            console.log(`Image loaded successfully: ${src}`);//delete later
            resolve(img);
        })
        img.addEventListener('error', () => {
            const error = new Error(`Image loaded failed: ${src}`);
            console.error(`Image loaded failed: ${src}`, error);
            reject(error)
        })
        img.src = src;
    })
}

let loadedAssets = {}; // put successfully loaded images

async function initGame(){
    try {
        const [bgImg, spriteSheet] = await Promise.all([
            loadImage(Assets.BACKGROUND),
            loadImage(Assets.SPRITE_SHEET)
        ])
        loadedAssets.bgImg = bgImg;
        loadedAssets.spriteSheet = spriteSheet;
        console.log(`all images loaded successfully, ready to start game!`);
    } catch (error) {
        console.error(`game initialize failed:`, error);
        alert(`please check images paths.`)
    }
}

let cw, ch;

function resize() {
    const {width, height} = bgCanvas.parentElement.getBoundingClientRect();
    [bgCanvas, canvas].forEach(c => {
        c.width = width;
        c.height =height;
    });
    cw = canvas.width;
    ch = canvas.height;
    if (isGameInitialized){
        drawBackground();
    }

}
let isGameInitialized = false;
resize(); // decide canvas' width and height first to let all the entity get correct x/y

function drawBackground(){
    bgCtx.drawImage(loadedAssets.bgImg, 0, 0, loadedAssets.bgImg.width, loadedAssets.bgImg.height - 100, 0, 0, cw, ch);
}

const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
})


let player1;
let player2;
let groundEnemies = [];
let skyEnemies = [];
const allEnemies = [groundEnemies, skyEnemies];
let levelSpeed = 2;
function setupEntities() {
    player1 = new Player(300, 300, levelSpeed, {left: 'KeyA', right: 'KeyD', jump: 'KeyW'});
    player2 = new Player(400, 300, levelSpeed, {left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp'});
    for (let i = 0; i < POOL_SIZE; i++) {
        let enemy = new GroundEnemy(levelSpeed);
        enemy.active = false;
        groundEnemies.push(enemy);
    }
    for (let i = 0; i < POOL_SIZE; i++) {
        let enemy = new SkyEnemy(levelSpeed);
        enemy.active = false;
        skyEnemies.push(enemy);
    }
}
function spawnGroundEnemy() {
    const enemy = groundEnemies.find(e => e.active === false);
    if (enemy){
        enemy.active = true;
        enemy.x = cw; // Enemy appear from right
    }
}

function spawnSkyEnemy() {
    const enemy = skyEnemies.find(e => e.active === false);
    if (enemy){
        enemy.active = true;
        enemy.x = cw; // Enemy appear from right

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

let isGameRunning = true;
// keep spawning enemy in random time between 1-3s until game stop
function startSpawningGroundEnemy() {
    if (!isGameRunning){ return;}
    //1000 - 3000 ms
    const randomTime = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
        spawnGroundEnemy();
        startSpawningGroundEnemy(); // recursive call for the next random interval
    }, randomTime);
}

function startSpawningSkyEnemy() {
    if (!isGameRunning){ return;}
    //1000 - 3000 ms
    const randomTime = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
        spawnSkyEnemy();
        startSpawningSkyEnemy(); // recursive call for the next random interval
    }, randomTime);
}


function gameLoop(){
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, cw, ch);
    [player1, player2].forEach(player => {
        player.update(keys);
        player.draw();
    })
    allEnemies.forEach(pool =>{
        pool.filter(enemy => enemy.active)
            .forEach(enemy => {
                enemy.update();
                enemy.draw();
            })
    })
}
window.addEventListener('resize', resize);

initGame()
    .then(() => {
        isGameInitialized = true;
        resize(); // resize again to prevent needed variable in initGame in the future
        setupEntities(); // new all enemy after img loaded successfully
        startSpawningGroundEnemy(); // start generating enemy
        startSpawningSkyEnemy();
        requestAnimationFrame(gameLoop);
        console.log(`game start!`);
    })
    .catch((err) => console.error(`sth accidentally wrong!`, err));

