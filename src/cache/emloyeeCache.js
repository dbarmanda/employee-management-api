const { redisClient } = require("./redis");

const CACHE_TTL = Number(process.env.REDIS_CACHE_TTL) || 60;
const CACHE_VERSION_KEY = "employees:cache:version";

async function getCacheVersion(){
    try {
        let version = await redisClient.get(CACHE_VERSION_KEY);
        if(!version){
            version = "1";
            await redisClient.set(CACHE_VERSION_KEY, version);
        }
        return version;
    } catch (error) {
        console.log("Redis getCacheVersioin error:", error);
        return "no-cache";
    }
}

async function invalidateEmployeeCache(){
    try {
        await redisClient.incr(CACHE_VERSION_KEY);
        console.log("Employee cache invalidated");
    } catch (error) {
        console.error("Redis cache invalidation error:", error);
    }
}

async function getCachedEmployee(key){
    try {
        const cacheData = await redisClient.get(key);
        if(!cacheData){
            return null;
        }
        return JSON.parse(cacheData);
    } catch (error) {
        console.error("Redis cache read error:", error);
        return null;
    }
}

async function cacheEmployees(key, employees){
    try {
        await redisClient.set(
            key,
            JSON.stringify(employees),{
                EX: CACHE_TTL
            }
        );
        console.log(
            `Employees cached: ${key} (TTL: ${CACHE_TTL}s)`
        );
    } catch (error) {
        console.error("Redis cache write error:", error);
    }
}

module.exports = {
    getCacheVersion,
    invalidateEmployeeCache,
    getCachedEmployee,
    cacheEmployees
}