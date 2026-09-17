const { createClient } = require("redis");

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        reconnectStrategy(retries){
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Client error: ", err);
});

redisClient.on("reconnecting", () => {
    console.log("Redis reconnecting...");
});

redisClient.on("ready", () => {
    console.log("Redis ready");
});

async function connectRedis(){

    if(redisClient.isOpen) {
        return;
    }

    await redisClient.connect();
    console.log("Redis connected");
}

module.exports = {
    redisClient,
    connectRedis
}

