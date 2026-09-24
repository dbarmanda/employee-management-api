const pool = require("../db/db");
const { redisClient } = require("../cache/redis");


async function checkReadiness(){
    const checks = {
        postgres: false,
        redis: false
    };

    try {
        await pool.query("SELECT 1");
        checks.postgres = true;
    } catch (error) {
        console.error("PostgreSQL readiness check failed:", error.message);
    }

    try {
        if(redisClient.isReady){
            const response = await redisClient.ping();
            checks.redis = response === "PONG";
        }
    } catch (error) {
        console.error("Redis readiness check failed:", error.message);
    }

    return {
        ready: checks.postgres && checks.redis,
        checks
    };
}

module.exports = { 
    checkReadiness
 };
 