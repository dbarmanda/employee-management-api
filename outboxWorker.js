const { employeeQueue } = require("./src/queue/employeeQueue");
const pool = require("./src/db/db");

const POLL_INTERVAL = 2000;
const BATCH_SIZE = 20;
const SHUTDOWN_TIMEOUT_MS = 8000;

let processingPromise;
let running = true;
let isShuttingDown = false;

async function processOutbox(){
    while(running){
        try {
            const result = await pool.query(
                `SELECT id, event_id, event_type,
                    aggregate_type, aggregate_id, payload
                 FROM outbox_messages
                 WHERE published_at IS NULL
                 ORDER BY id
                 LIMIT $1`,
                [BATCH_SIZE]
            );

            if(result.rows.length === 0){
                await sleep(POLL_INTERVAL);
                continue;
            }
            for(const message of result.rows){
                try {
                    await employeeQueue.add(
                        message.event_type,
                        {
                            eventId: message.event_id,
                            aggregateType: message.aggregate_type,
                            aggregateId: message.aggregate_id,
                            payload: message.payload
                        },
                        {
                            jobId: message.event_id,
                            attempts: 3,
                            backoff: {
                                type: "exponential",
                                delay: 1000
                            },
                            removeOnComplete: 100,
                            removeOnFail: 500
                        }
                    );

                    await pool.query(
                        `UPDATE outbox_messages
                         SET published_at = CURRENT_TIMESTAMP,
                             attempts = attempts + 1
                         WHERE id = $1
                           AND published_at IS NULL`,
                        [message.id]
                    );
                    console.log(`Outbox event published: ${message.event_id}`);
                } catch (error) {
                    await pool.query(
                        `UPDATE outbox_messages
                         SET attempts = attempts + 1
                         WHERE id = $1`,
                        [message.id]
                    );
                    console.error(`Failed to publish outbox event ${message.event_id}`, error.message);
                }
            }
        } catch (error) {
            console.error("Outbox worker error:", error.message);
            await sleep(POLL_INTERVAL);
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function shutdown(signal) {

    if(isShuttingDown){
        true;
    }
    isShuttingDown = true;

    console.log(
        `${signal} received. Shutting down outbox worker...`
    );
    
    const forceShutdownTimer = setTimeout(() => {
       console.error("Graceful shudown timed out. Forcing exit.");
       process.exit(1); 
    }, SHUTDOWN_TIMEOUT_MS);
    forceShutdownTimer.unref();

    try {
        running = false;    //Tell pooling loop not to start another iteration

        //Wait for the current iteration to finish.
        if(processingPromise){
            await processingPromise;
        }
        console.log("Outbox polling stopped.");

        await employeeQueue.close();
        console.log("Employee queue closed.");

        await pool.end();
        console.log("PostgreSQL pool closed.");

        console.log("Outbox worker shut down gracefully.");
        process.exit(0);
    } catch (error) {
        console.error(
            "Error shutting down outbox worker:",
            error
        );

        process.exit(1);
    }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("Outbox worker started.");

// processOutbox();
processingPromise = processOutbox();