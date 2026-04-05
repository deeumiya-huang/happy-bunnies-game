import {ctx} from "./config.js";
import {Entity} from "./entity.js";

class Enemy extends Entity{
    constructor(speed) {
        super(speed);
        this.dx = -this.speed; // Enemy walk from right to left
    }

    draw(){
        ctx.fillStyle = 'blue';
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

}