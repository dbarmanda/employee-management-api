const pool = require("../src/db/db");
const {
    createOutboxMessage
} = require("../src/services/outboxService");

describe("Outbox", () => {
    test("creates an outbox message", async () => {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const eventId = await createOutboxMessage(client, {
                eventType: "employee.test",
                aggregateType: "employee",
                aggregateId: 999999,
                payload: {
                    test: true
                }
            });

            await client.query("COMMIT");

            expect(eventId).toBeDefined();

            const result = await pool.query(
                `SELECT *
                 FROM outbox_messages
                 WHERE event_id = $1`,
                [eventId]
            );

            expect(result.rows).toHaveLength(1);

            await pool.query(
                `DELETE FROM outbox_messages
                 WHERE event_id = $1`,
                [eventId]
            );
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    });
});
