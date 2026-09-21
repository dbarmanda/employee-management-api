const { employeeQueue } = require("../src/queue/employeeQueue");

describe("Employee queue", () => {
    test("can enqueue an employee event", async () => {
        const job = await employeeQueue.add(
            "employee-created",
            {
                employeeId: 99999,
                payload: {
                    name: "Queue Test"
                }
            },
            {
                removeOnComplete: true,
                removeOnFail: true
            }
        );
        expect(job.id).toBeDefined();
        expect(job.name).toBe("employee-created");
        // await job.remove();
    });
});
