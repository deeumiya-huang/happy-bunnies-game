import {canvas, ctx, POOL_SIZE} from "./config.js";
import { Player} from "./player.js";
import { GroundEnemy} from "./enemy.js";

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
function setupEntities() {
    player1 = new Player(300, 300, 5, {left: 'KeyA', right: 'KeyD', jump: 'KeyW'});
    player2 = new Player(400, 300, 5, {left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp'});
    for (let i = 0; i < POOL_SIZE; i++) {
        let enemy = new GroundEnemy(5);
        enemy.active = false;
        groundEnemies.push(enemy);
    }
}
function spawnEnemy() {
    const enemy = groundEnemies.find(e => e.active === false);
    if (enemy){
        enemy.active = true;
        enemy.x = cw; // Enemy appear from right
    }
}

let isGameRunning = true;
// keep spawning enemy in random time between 1-3s until game stop
function startSpawning() {
    if (!isGameRunning){ return;}
    //1000 - 3000 ms
    const randomTime = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(() => {
        spawnEnemy();
        startSpawning(); // recursive call for the next random interval
    }, randomTime);
}



function gameLoop(){
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, cw, ch);
    [player1, player2].forEach(player => {
        player.update(keys);
        player.draw();
    })
    groundEnemies
        .filter(enemy => enemy.active)
        .forEach(enemy => {
            enemy.update();
            enemy.draw();
        })

}
window.addEventListener('resize', resize);

initGame()
    .then(() => {
        isGameInitialized = true;
        resize(); // resize again to prevent needed variable in initGame in the future
        setupEntities(); // new all enemy after img loaded successfully
        startSpawning(); // start generating enemy
        requestAnimationFrame(gameLoop);
        console.log(`game start!`);
    })
    .catch((err) => console.error(`sth accidentally wrong!`, err));

