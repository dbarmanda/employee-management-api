const pool = require("../src/db/db");

describe("Audit idempotency", () => {
    test("duplicate event IDs do not create duplicate audit logs", async () => {
        const eventId =
            "11111111-1111-4111-8111-111111111111";

        await pool.query(
            `DELETE FROM employee_audit_logs
             WHERE event_id = $1`,
            [eventId]
        );

        await pool.query(
            `INSERT INTO employee_audit_logs
                (
                    event_id,
                    employee_id,
                    action,
                    payload
                )
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (event_id) DO NOTHING`,
            [
                eventId,
                999999,
                "created",
                JSON.stringify({
                    test: true
                })
            ]
        );

        await pool.query(
            `INSERT INTO employee_audit_logs
                (
                    event_id,
                    employee_id,
                    action,
                    payload
                )
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (event_id) DO NOTHING`,
            [
                eventId,
                999999,
                "created",
                JSON.stringify({
                    test: true
                })
            ]
        );

        const result = await pool.query(
            `SELECT *
             FROM employee_audit_logs
             WHERE event_id = $1`,
            [eventId]
        );

        expect(result.rows).toHaveLength(1);

        await pool.query(
            `DELETE FROM employee_audit_logs
             WHERE event_id = $1`,
            [eventId]
        );
    });
});
