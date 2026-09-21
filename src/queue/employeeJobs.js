const { employeeQueue } = require("./employeeQueue");

async function queueEmployeeEvent(action, employeeId, payload = {}) {
    try {
        await employeeQueue.add(
            `employee-${action}`,
            {
                employeeId,
                payload
            }, 
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000
                },
                removeOnComplete: 100,
                removeOnFail: 500
            }
        );
        console.log(`Employee ${action} job queued for employee ${employeeId}`);
    } catch (error) {
        console.error(`Failed to queue employee ${action} job:`, error);
    }
}

module.exports = {
    queueEmployeeEvent
};
