export class Player{
    constructor(x, y, speed, controls) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 80;
        this.dx = 0;
        this.dy = 0;
        this.speed = speed;
        this.jumpForce = 20;
        this.gravity = 0.8;
        this.jumpCount = 0;
        this.controls = controls;
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
    update(keys, ch) {
        this.dx = 0;
        if(keys[this.controls.left]){this.dx -= this.speed;}
        if(keys[this.controls['right']]){this.dx += this.speed;}
        if(keys[this.controls['jump']]){
            this.jump();
            keys[this.controls['jump']] = false;
            if (this.dy < 0){
                this.dy -= 0.3; //Reduce gravity
            }
        }

        this.dy += this.gravity;
        this.x += this.dx;
        this.y += this.dy;
        // when falling on the ground
        if(this.y + this.height > ch){
            this.y = ch - this.height;
            this.dy = 0;
            this.jumpCount = 0; //reset jumping times
        }
    }

}