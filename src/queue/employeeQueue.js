const { Queue } = require("bullmq");
const connection = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
};

//Queue producer's connection to redis.
const employeeQueue = new Queue("employee-events", {
    connection
});

module.exports = {
    employeeQueue,
    connection
};

