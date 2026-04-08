import {ctx} from "./config.js";
import {Entity} from "./entity.js";
import {loadedAssets} from "./index.js";

class Enemy extends Entity{
    constructor(speed) {
        super(speed);
        this.dx = -this.speed; // Enemy walk from right to left
    }

    draw(){
        ctx.fillStyle = this.isHit ?'green' : 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    update(){
        if(!this.active){return;} // prevent calling enemy from somewhere other than initGame in the future
        this.x += this.dx;
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }
}

export class GroundEnemy extends Enemy {
    constructor(speed) {
        super(speed);
        this.y = ctx.canvas.height - this.height - this.ground;
    }
    draw(){
        if(!this.active){return;}
        this.updateMoveAnimation()
        let spriteName = '';
        if (this.moveFrame === 1) {
            spriteName = `spikeMan_walk2.png`; //change between stand and walk
        } else {
            spriteName = `spikeMan_stand.png`;
        }
        const s = loadedAssets.atlas[spriteName];
        ctx.save();
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(loadedAssets.spriteSheet, s.x, s.y, s.width, s.height, 0, 0, this.width, this.height);
        ctx.restore();
    }
}

export class SkyEnemy extends Enemy {
    constructor(speed) {
        super(speed);
        this.width = 60;
        this.height = 30;
        this.baseY = 350;
        this.y = ctx.canvas.height - this.height - this.baseY;
        this.amplitude = 30;
        this.angle = 0;
        this.angleSpeed = 0.05;
    }
    draw() {
        if(!this.active){return;}
        this.updateMoveAnimation()
        let spriteName = '';
        if (this.moveFrame === 1) {
            spriteName = `wingMan3.png`;
        } else {
            spriteName = `wingMan4.png`;
        }
        const s = loadedAssets.atlas[spriteName];
        ctx.drawImage(loadedAssets.spriteSheet, s.x, s.y, s.width, s.height, this.x, this.y, this.width, this.height);

    }
    update() {
        super.update();
        this.angle += this.angleSpeed;
        this.y = this.baseY + Math.sin(this.angle)* this.amplitude;
    }
}