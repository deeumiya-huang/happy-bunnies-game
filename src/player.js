export class Player{
    constructor(x, y, speed, controls) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.dx = 0;
        this.dy = 0;
        this.speed = speed;
        this.jumpForce = 17;
        this.gravity = 0.6;
        this.jumpCount = 0;
        this.controls = controls;
        this.ground = 125;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    jump(){
        if(this.jumpCount < 2){
            this.dy = -this.jumpForce;
            this.jumpCount++;
        }
    }
    update(keys, cw, ch) {
        this.dx = 0;
        if(keys[this.controls.left]){this.dx -= this.speed;}
        if(keys[this.controls.right]){this.dx += this.speed;}
        if(keys[this.controls.jump]){
            this.jump();
            keys[this.controls.jump] = false;
            if (this.dy < 0){
                this.dy -= 0.3; //Reduce gravity
            }
        }

        this.dy += this.gravity;
        this.x += this.dx;
        this.y += this.dy;
        // when falling on the ground
        if(this.y + this.height > ch - this.ground){
            this.y = ch - this.height - this.ground;
            this.dy = 0;
            this.jumpCount = 0; //reset jumping times
        }
        // when hitting the wall
        if (this.x < 0 ){
            this.x = 0;
            this.dx = 0;
        } else if ( this.x + this.width > cw) {
            this.x = cw - this.width;
            this.dx = 0;
        }
    }

}