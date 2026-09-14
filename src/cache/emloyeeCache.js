const { redisClient } = require("./redis");

const CACHE_TTL = 60;
const CACHE_VERSION_KEY = "employees:cache:version";

async function getCacheVersion(){
    let version = await redisClient.get(CACHE_VERSION_KEY);
    if(!version){
        version = "1";
        await redisClient.set(CACHE_VERSION_KEY, version);
    }
    return version;
}

async function invalidateEmployeeCache(){
    await redisClient.incr(CACHE_VERSION_KEY);
    console.log("Employee cache invalidated");
}

async function getCachedEmployee(key){
    const cacheData = await redisClient.get(key);
    if(!cacheData){
        return null;
    }
    return JSON.parse(cacheData);
}

async function cacheEmployees(key, employees){
    await redisClient.set(
        key,
        JSON.stringify(employees),{
            EX: CACHE_TTL
        }
    );
}

module.exports = {
    getCacheVersion,
    invalidateEmployeeCache,
    getCachedEmployee,
    cacheEmployees
}