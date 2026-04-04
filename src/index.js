const bgCanvas = document.querySelector('#bgCanvas');
const canvas = document.querySelector('#mainCanvas');

const bgCtx = bgCanvas.getContext('2d');
const ctx = canvas.getContext('2d');

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
        img.addEventListener('error', (e) => {
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
    drawBackground();
}

function drawBackground(){
    bgCtx.drawImage(loadedAssets.bgImg, 0, 0, loadedAssets.bgImg.width, loadedAssets.bgImg.height - 100, 0, 0, cw, ch);
}

function gameLoop(){
    requestAnimationFrame(gameLoop);
    ctx.clearRect(0, 0, cw, ch);
    player1.draw();
}
window.addEventListener('resize', resize);

initGame()
    .then(() => {
        resize();
        requestAnimationFrame(gameLoop);
        console.log(`game start!`);
    })
    .catch((err) => console.error(`sth accidentally wrong!`, err));

