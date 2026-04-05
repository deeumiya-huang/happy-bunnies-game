import {GAME_SETTINGS} from "./config.js";

export class Entity{
    constructor(speed) {
        this.x = 0;
        this.y = 0;
        this.width = 50;
        this.height = 80;
        this.speed = speed;
        this.dx = 0;
        this.dy = 0;
        this.ground = GAME_SETTINGS.groundLevel;
        this.gravity = GAME_SETTINGS.gravity;
    }
}