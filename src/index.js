import {canvas, ctx, POOL_SIZE} from "./config.js";
import { Player } from "./player.js";
import { GroundEnemy, SkyEnemy } from "./enemy.js";

const bgCanvas = document.querySelector('#bgCanvas');
const bgCtx = bgCanvas.getContext('2d');

let isGameInitialized = false; // Whether resources are fully loaded (formerly isGameInitialized)
let isGameStarted = false; // Whether the game has been started via click
let isGameRunning = false;

const startBtn = document.querySelector('#game-start');
const pauseBtn = document.querySelector('#game-pause');

const Assets = {
    BACKGROUND: './assets/backgroundColorForest.png',
    SPRITE_SHEET: './assets/spritesheet_jumper.png',
    SPRITE_SHEET_XML: './assets/spritesheet_jumper.xml'
};
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    // Enter key pressed - triggering start button
    if (e.code === 'Enter' && isGameInitialized && !isGameStarted) {startBtn.click();}
    // P key pressed - triggering pause button
    if (e.code === 'KeyP' && isGameStarted) {pauseBtn.click();}
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
})

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

export let loadedAssets = {}; // put successfully loaded images
async function initGame(){
    try {
        const [bgImg, spriteSheet, xmlString] = await Promise.all([
            loadImage(Assets.BACKGROUND),
            loadImage(Assets.SPRITE_SHEET),
            loadAtlas(Assets.SPRITE_SHEET_XML)
        ])
        loadedAssets.bgImg = bgImg;
        loadedAssets.spriteSheet = spriteSheet;
        loadedAssets.atlas = parseAtlasXML(xmlString);
        console.log(`all images and xml files loaded successfully, ready to start game!`);
    } catch (error) {
        console.error(`game initialize failed:`, error);
        alert(`please check image and xml file paths.`)
    }
}

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

resize(); // decide canvas' width and height first to let all the entity get correct x/y

function drawBackground(){
    bgCtx.drawImage(loadedAssets.bgImg, 0, 0, loadedAssets.bgImg.width, loadedAssets.bgImg.height - 100, 0, 0, canvas.width, canvas.height);
}




let player1;
let player2;
let groundEnemies = [];
let skyEnemies = [];
const allEnemies = [groundEnemies, skyEnemies];
let levelSpeed = 2;
function setupEntities() {
    player1 = new Player(1,300, 300, levelSpeed, {left: 'KeyA', right: 'KeyD', jump: 'KeyW'});
    player2 = new Player(2,400, 300, levelSpeed, {left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp'});
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
    players.forEach(p => {
        allEnemies.forEach(pool => {
            pool.forEach(e => {
                if (e.active && checkCollision(p.getHitbox(), e.getHitbox())) {
                    // gameOver();
                    e.isHit = true;
                }
            })
        })
    })
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
// transfer xmlString to json Object
function parseAtlasXML(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const subTextures = xmlDoc.getElementsByTagName("SubTexture");
    const atlas = {};
    for (let subTexture of subTextures) {
        const name = subTexture.getAttribute("name");
        atlas[name] = {
            x: parseInt(subTexture.getAttribute("x")),
            y: parseInt(subTexture.getAttribute("y")),
            width: parseInt(subTexture.getAttribute("width")),
            height: parseInt(subTexture.getAttribute("height"))
        };
    }
    return atlas;
}

async function loadAtlas(src) {
    return fetch(src).then(response => {
        if (!response.ok) throw new Error(`Failed to load: ${src}`);
        return response.text();
    });
}

function gameLoop(){
    // put request in first order can prevent game shutdown just because one frame is broken
    if (!isGameRunning) {return;}
    requestAnimationFrame(gameLoop);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    [player1, player2].forEach(player => {player.update(keys)})
    allEnemies.forEach(pool =>{
        pool.filter(enemy => enemy.active)
            .forEach(enemy => {enemy.update()})
    })
    updateEnemyCollision();
    updatePlayerCollision();

    allEnemies.forEach(pool => {
        pool.filter(enemy => enemy.active)
            .forEach(enemy => {
                enemy.draw();
            });
    });
    [player1, player2].forEach(player => {player.draw()}) // player draw after enemy to prevent block by enemy
}
window.addEventListener('resize', resize);

// --- Initial Load (Executes on page load to display the background) ---
initGame()
    .then(() => {
        isGameInitialized = true;

        resize(); // resize again to prevent needed variable in initGame in the future also draw background
        setupEntities(); // new all enemy after img loaded successfully
        console.log(`game initialize!`);
    })
    .catch((err) => console.error(`sth accidentally wrong!`, err));

// --- Start Button Logic ---
startBtn.addEventListener('click', () => {
    if (!isGameInitialized || isGameStarted) return;// If resources aren't ready yet, or if the game has already started, do nothing
    isGameStarted = true; // Mark as started
    isGameRunning = true; // Mark as running

    startBtn.style.display = 'none';
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
