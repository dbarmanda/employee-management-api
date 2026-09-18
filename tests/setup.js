// require("dotenv").config({
//     path: ".env.test"
// }); --> Node already doing this in the package.json "test" script.

const { 
    redisClient,
    connectRedis 
} = require("../src/cache/redis");
const pool = require("../src/db/db");

beforeAll(async() => {
    await connectRedis();
});

afterAll(async() => {
    // await redisClient.quit();
    // pool.end();
    if(redisClient.isOpen){
        await redisClient.quit();
    }
})
