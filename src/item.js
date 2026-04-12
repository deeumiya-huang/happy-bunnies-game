import {canvas, ctx} from "./config.js";
import {Entity} from "./entity.js";
import {loadedAssets} from "./asset-loader.js";

export class Item extends Entity{
    constructor(speed) {
        super(speed);
        this.dy = this.speed; // item fall from top
        this.width = 40;
        this.height = 40;
    }
    draw(){
        if(!this.active){return;}
        const s = loadedAssets.atlas[`carrot_gold.png`];
        ctx.drawImage(loadedAssets.spriteSheet, s.x, s.y, s.width, s.height, this.x, this.y, this.width, this.height);
    }
    update(){
        if(!this.active){return;}
        this.y += this.dy;
        if (this.y > canvas.height) {
            this.active = false;
        }
    }
}