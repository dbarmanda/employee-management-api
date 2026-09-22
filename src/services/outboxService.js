const crypto = require("crypto");

async function createOutboxMessage(
    client,
    {
        eventType, aggregateType, aggregateId, payload
    }
){
    const eventId = crypto.randomUUID();
    await client.query(
        `INSERT INTO outbox_messages
            (
                event_id,
                event_type,
                aggregate_type,
                aggregate_id,
                payload
            )
         VALUES ($1, $2, $3, $4, $5)`,
         [eventId, eventType, aggregateType, aggregateId, JSON.stringify(payload)]
    );
    return eventId;
}

module.exports = { createOutboxMessage };
