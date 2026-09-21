const { Worker } = require("bullmq");
const pool = require("./src/db/db");

const connection = {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT)
};

const worker = new Worker(
    "employee-events",
    async(job) => {
        console.log(
            `Processing job ${job.id}: ${job.name}`
        );
        const { employeeId, payload } = job.data;
        let action;

        switch(job.name){
            case "employee-created":
                action = "created";
                break;
            case "employee-updated":
                action = "updated";
                break;
            case "employee-deleted":
                action = "deleted";
                break;
            default:
                throw new Error(`Unknown job type: ${job.name}`);
        }

        await pool.query(
            `INSERT INTO employee_audit_logs
                (employee_id, action, payload)
            VALUES ($1, $2, $3)`,
            [employeeId, action, payload]
        );
        console.log(
            `Audit log created: employee=${employeeId}, action=${action}`
        );
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
    console.log(`${signal} received. Shutting down worker...`);
    await worker.close();
    await pool.end();

    console.log("Worker shud down gracefully.");
    process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("Employee worker started.");