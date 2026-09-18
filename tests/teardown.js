// const { redisClient } = require("../src/cache/redis");
const pool = require("../src/db/db");

module.exports = async () => {
    // await redisClient.quit();
    await pool.end();
}
