import {ctx, GAME_SETTINGS} from "./config.js";

export class Entity{
    constructor(speed) {
        this.x = 0;
        this.y = 0;
        this.width = 40;
        this.height = 67;
        this.speed = speed;
        this.dx = 0;
        this.dy = 0;
        this.ground = GAME_SETTINGS.groundLevel;
        this.gravity = GAME_SETTINGS.gravity;
        this.padding = 6; //change hitbox size
        this.isHit = false;
        this.state = 'stop'; // condition：stop, walk, jump, hurt
        this.moveFrame = 1; // move frame: 1 or 2
        this.frameTimer = 0; // to control the speed of changing move images
        this.active = false;
        this.alpha = 1; // 0 for transparent
    }
    draw() {
        // // test rectangle
        // ctx.fillStyle = 'red';
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        // // for hitbox test
        // ctx.strokeStyle = 'yellow';
        // ctx.lineWidth = 2;
        // const box = this.getHitbox();
        // ctx.strokeRect(box.x, box.y, box.width, box.height);
    }

    getHitbox() {
        return {
            x: this.x + this.padding,
            y: this.y + this.padding,
            width: this.width - this.padding * 2,
            height: this.height - this.padding * 2
        }
    }
    updateMoveAnimation() {
        this.frameTimer++; //keep adding 1 each frame and reset to 0 every 10 frames
        if (this.frameTimer > 10) {
            this.moveFrame = this.moveFrame === 1 ? 2 : 1;
            this.frameTimer = 0;
        }
    }
}