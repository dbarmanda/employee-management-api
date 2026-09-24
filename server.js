// require("dotenv").config();

const app = require("./src/app");

const pool = require("./src/db/db");
// const { connectRedis } = require("./src/cache/redis");
const { 
    redisClient,
    connectRedis
} = require("./src/cache/redis");


const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT_MS = 8000;

let server;

async function startServer(){
    await connectRedis();
    server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })
}

let isShuttingDown = false;
async function shutdown(signal){
    if(isShuttingDown){
        return;
    }

    isShuttingDown = true;
    
    console.log(`${signal} received. Started graceful shutdown...`);

    const forceShutdownTimer = setTimeout(() => {
       console.error("Graceful shudown timed out. Forcing exit.");
       process.exit(1); 
    }, SHUTDOWN_TIMEOUT_MS);
    forceShutdownTimer.unref();

    if(server){
        server.close(async () => {
            try {
                console.log("HTTP server closed.");
                if(redisClient.isOpen){
                    await redisClient.quit();
                    console.log("Redis connection closed.");
                }

                await pool.end();
                console.log("PostgreSQL pool closed.");
                process.exit(0);
            } catch (error) {
                console.error("Error during server shutdown:", error);
                process.exit(1);
            }
        });
    }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// startServer();
startServer().catch(error => {
    console.error("Failed to start server:", error);
    process.exit(1);
});

