const { createClient } = require("redis");

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT)
    }
});

redisClient.on("error", (err) => {
    console.error("Redis Client error: ", err);
});

async function connectRedis(){
    await redisClient.connect();
    console.log("Redis connected");
}

module.exports = {
    redisClient,
    connectRedis
}

