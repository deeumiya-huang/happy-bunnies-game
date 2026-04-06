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
        this.onGround = false;
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // for hitbox test
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 2;
        const box = this.getHitbox();
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
    jump(){
        if(this.jumpCount < 2){
            this.dy = -this.jumpForce;
            this.jumpCount++;
        }
    }
    update(keys) {
        this.dx = 0; // reset dx each frame
        if(keys[this.controls.left]){this.dx -= this.speed;}
        if(keys[this.controls.right]){this.dx += this.speed;}
        if(keys[this.controls.jump]){
            this.jump();
            keys[this.controls.jump] = false;
            if (this.dy < 0){
                this.dy -= 0.2; //Reduce gravity
            }
        }

        //---- Gravity handling ----
        let currentGravity = this.gravity;
        // Reduce gravity when the character is near the apex (dy close to 0) to create a "hang time" effect
        if (Math.abs(this.dy) < 2) {
            currentGravity = this.gravity * 0.5; // Halve the gravity
        }
        // only add gravity when the character in the air
        if (!this.onGround) {
            this.dy += currentGravity;
        }

        this.x += this.dx;
        this.y += this.dy;

        // ground collision detection
        const groundY = ctx.canvas.height - this.height - this.ground;

        if (this.y >= groundY) {
            this.onGround = true;
            this.y = groundY;
            this.dy = 0;
            this.jumpCount = 0; // reset jumping times
        } else {
            this.onGround = false;
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