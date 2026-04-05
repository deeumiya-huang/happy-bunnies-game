import {ctx} from "./config.js";
import {Entity} from "./entity.js";

export class Player extends Entity{
    constructor(x, y, speed, controls) {
        super(speed);
        this.x = x;
        this.y = y;
        this.jumpForce = 15;
        this.jumpCount = 0;
        this.controls = controls;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    jump(){
        if(this.jumpCount < 2){
            this.dy = -this.jumpForce;
            this.jumpCount++;
        }
    }
    update(keys) {
        this.dx = 0;
        if(keys[this.controls.left]){this.dx -= this.speed;}
        if(keys[this.controls.right]){this.dx += this.speed;}
        if(keys[this.controls.jump]){
            this.jump();
            keys[this.controls.jump] = false;
            // if (this.dy < 0){
            //     this.dy -= 0.2; //Reduce gravity
            // }
        }

        this.dy += this.gravity;
        this.x += this.dx;
        this.y += this.dy;
        // when falling on the ground
        if(this.y + this.height > ctx.canvas.height - this.ground){
            this.y = ctx.canvas.height - this.height - this.ground;
            this.dy = 0;
            this.jumpCount = 0; //reset jumping times
        }
        // when hitting the wall
        if (this.x < 0 ){
            this.x = 0;
            this.dx = 0;
        } else if ( this.x + this.width > ctx.canvas.width) {
            this.x = ctx.canvas.width - this.width;
            this.dx = 0;
        }
    }

}