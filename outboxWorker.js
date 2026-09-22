const { employeeQueue } = require("./src/queue/employeeQueue");
const pool = require("./src/db/db");

const POLL_INTERVAL = 2000;
const BATCH_SIZE = 20;

let running = true;

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
    }//while loop
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function shutdown(signal) {
    console.log(
        `${signal} received. Shutting down outbox worker...`
    );
    running = false;
    await pool.end();
    console.log("Outbox worker shut down.");
    process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("Outbox worker started.");

processOutbox();
