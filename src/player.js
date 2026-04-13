import { ctx } from "./config.js";
import { Entity } from "./entity.js";
import { loadedAssets } from "./asset-loader.js";

export class Player extends Entity{
    constructor(playerNumber, x, y, speed, controls) {
        super(speed);
        this.playerNumber = playerNumber;
        this.x = x;
        this.y = y;
        this.jumpForce = 15;
        this.jumpCount = 0;
        this.controls = controls;
        this.onGround = false;
        this.isInvincible = false;
        this.invincibilityTimer = 0;
        this.facing = 0; // -1 represent walk left side
        this.deathCounter = 0; //to play death animation after the player death
        this.animationFinished = false;
        this.remainingLives = 3;
        this.score = 0;
    }

    draw() {
        if (!this.active) return;
        let spriteName;
        if (this.state === 'jump') {
            spriteName = `bunny${this.playerNumber}_jump.png`;
        } else if (this.state === 'walk') {
            spriteName = `bunny${this.playerNumber}_walk${this.moveFrame}.png`; //change between walk1 and walk2
        } else if (this.state === 'hurt'){
            spriteName = `bunny${this.playerNumber}_hurt.png`;
        } else {
            spriteName = `bunny${this.playerNumber}_stand.png`;
        }
        const s = loadedAssets.atlas[spriteName];
        // use ctx.scale to chanhe image direction when walking to left side
        ctx.save();
        ctx.globalAlpha = this.alpha; // make the player blinking when hurt
        if (this.facing === -1) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(loadedAssets.spriteSheet, s.x, s.y, s.width, s.height, 0, 0, this.width, this.height);
        } else if (!this.onGround){
            ctx.drawImage(loadedAssets.spriteSheet, s.x, s.y, s.width, s.height, this.x - 5, this.y, this.width + 10, this.height - 6);
        } else {
            ctx.drawImage(loadedAssets.spriteSheet, s.x, s.y, s.width, s.height, this.x, this.y, this.width, this.height);
        }
        ctx.restore();

    }
    jump(){
        if(this.jumpCount < 2){
            this.dy = -this.jumpForce;
            this.jumpCount++;
        }
    }
    update(keys) {
        if(!this.active){return;}
        this.dx = 0; // reset dx each frame
        if (this.state === 'hurt') {
            this.onGround = false;
            this.dy += this.gravity / 3; // divided by 3 to make the animation slower
            this.y += this.dy;
            this.isInvincible = true; // prevent reduce life again after hurt.
            this.deathCounter++; // Play death animation for 5s and game over
            this.alpha = 0.6 + Math.sin(this.deathCounter * 0.5) * 0.4; // make alpha between 0.2 - 1
            if (this.deathCounter > 300) {
                this.animationFinished = true;
                this.alpha = 1;
                this.isInvincible = false;
            }
            return; // skip the movement logic so that player can fall off the screen
        }
        if (this.isInvincible) {
            this.invincibilityTimer--;
            this.alpha = 0.7;

            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
                this.alpha = 1;
            }
        }
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

        // change the state for changing images
        if (!this.onGround) {
            this.state = 'jump';
            this.facing = 0;
        } else if (this.dx !== 0) {
            this.state = 'walk';
            if (this.dx < 0) {
                this.facing = -1;
            } else {
                this.facing = 0;
            }
            this.updateMoveAnimation(); // change images for movement
        } else {
            this.state = 'stop';
            this.facing = 0;
        }
    }

}