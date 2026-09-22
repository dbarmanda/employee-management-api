const { Worker } = require("bullmq");
const pool = require("./src/db/db");

// const connection = {
//     host: process.env.REDIS_HOST,
//     port: Number(process.env.REDIS_PORT)
// };
const { connection } = require("./src/queue/employeeQueue");

const worker = new Worker(
    "employee-events",
    async(job) => {
        // console.log(`Processing job ${job.id}: ${job.name}`);
        console.log(`Processing event ${job.data.eventId}: ${job.name}`);

        // const { employeeId, payload } = job.data;
        const { eventId, aggregateId, payload } = job.data;

        // let action;
        const actionMap = {
            "employee.created": "created",
            "employee.updated": "updated",
            "employee.deleted": "deleted"
        }

        // switch(job.name){
        //     case "employee-created":
        //         action = "created";
        //         break;
        //     case "employee-updated":
        //         action = "updated";
        //         break;
        //     case "employee-deleted":
        //         action = "deleted";
        //         break;
        //     default:
        //         throw new Error(`Unknown job type: ${job.name}`);
        // }
        const action = actionMap[job.name];
        if(!action){
            throw new Error(`Unknown event type: ${job.name}`);
        }

        // await pool.query(
        //     `INSERT INTO employee_audit_logs
        //         (employee_id, action, payload)
        //     VALUES ($1, $2, $3)`,
        //     [employeeId, action, payload]
        // );
        const result = await pool.query(
            `INSERT INTO employee_audit_logs
                (event_id, employee_id, action, payload)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (event_id) DO NOTHING
             RETURNING id`,
            [eventId, aggregateId, action, JSON.stringify(payload)]
        );
            //ON CONFLICT (event_id) DO NOTHING --> idempotent event processing..
        if(result.rows.length === 0){
            console.log(`Duplicate event ignored: ${eventId}`);
            return;
        }

        // console.log(`Audit log created: employee=${employeeId}, action=${action}`);
        console.log(`Audit log created for event ${eventId}`);
    },
    {
        connection,
        concurrency: 5
    }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, error) => {
    console.error(`Job ${job.id} failed:`, error.message);
});

worker.on("error", (error) => {
    console.error(`Worker error:`, error);
});

async function shutdown(signal){
    console.log(`${signal} received. Shutting down audit worker...`);
    await worker.close();
    await pool.end();

    console.log("Audit worker shut down gracefully.");
    process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("Employee audit worker started.");
