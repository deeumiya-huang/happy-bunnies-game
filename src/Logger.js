class Logger {
    static levels = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3
    }
    constructor(level = "debug") {
        this.currentLevel = level;
    }

    shouldLog(level){
        return Logger.levels[level] > Logger.levels[this.currentLevel];
    }

    debug(...args) {
        if (this.shouldLog("debug")) {
            console.log("DEBUG: ", ...args)
        }
    }

    info(...args) {
        if(this.shouldLog("info")) {
            console.log("[INFO]: ", ...args);
        }
    }

    warn(...args) {
        if(this.shouldLog("warn")) {
            console.log("[WARN]: ", ...args);
        }
    }

    error(...args) {
        if(this.shouldLog("error")) {
            console.error("[ERROR]: ", ...args);
        }
    }
}

export const logger = new Logger("info"); // set the level we want to log.