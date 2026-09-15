const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/db/db");
const expectCookies = require("supertest/lib/cookies");

//--- Request tests
describe("GET /", () => {
    test("should return API message", async() => {
        const response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            message: "Employee Management API"
        });
    });
});

describe("GET /employees", () => {
    test("should return employees with pagination", async() => {
        const response = await request(app).get("/employees");
        //expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("data");
        expect(response.body).toHaveProperty("pagination");

        expect(Array.isArray(response.body.data)).toBe(true);

        expect(response.body.pagination).toHaveProperty("page");
        expect(response.body.pagination).toHaveProperty("limit");
        expect(response.body.pagination).toHaveProperty("total");
        expect(response.body.pagination).toHaveProperty("totalPages");

        
    });
});

describe("POST /employees", () => {
    test("should create a new employee", async() => {
        const response = await request(app)
            .post("/employees")
            .send({
                name: "Test Employee",
                department: "Testing",
                salary: 65000
            });

        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty("id");
        expect(response.body.name).toBe("Test Employee");
        expect(response.body.department).toBe("Testing");
        expect(response.body.salary).toBe("65000.00");

        await pool.query("DELETE FROM employees WHERE id = $1", [response.body.id]);
    });
});

describe("GET /employees/:id", () => {
    test("should return an employee by id", async() => {
        const response = await request(app)
            .get("/employees/1");

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id", 1);
        expect(response.body).toHaveProperty("name");
        expect(response.body).toHaveProperty("department");
        expect(response.body).toHaveProperty("salary");
    });

    test("should return 404 when employee does not exist", async() => {
        const response = await request(app).get("/employees/99999");
        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /employees/:id", () => {
    test("should update an employee", async() => {
        //Create test employee
        const createResponse = await request(app)
            .post("/employees")
            .send({
                name: "PUT Test Employee",
                department: "Testing",
                salary: 9999
            });
        expect(createResponse.statusCode).toBe(201);

        const employeeId = createResponse.body.id;

        //Update test employee
        const updateResponse = await request(app)
            .put(`/employees/${employeeId}`)
            .send({
                name: "Updated Employee",
                department: "Engineering",
                salary: 75000
            });

        expect(updateResponse.statusCode).toBe(200);
        expect(updateResponse.body).toHaveProperty("id", employeeId);
        expect(updateResponse.body.name).toBe("Updated Employee");
        expect(updateResponse.body.department).toBe("Engineering");
        expect(updateResponse.body.salary).toBe("75000.00");

        await pool.query(
            "DELETE FROM employees WHERE id = $1",
            [employeeId]
        );
    });

    test("should return 404 when updating a non-existent employee", async () => {

        const response = await request(app)
            .put("/employees/999999999")
            .send({
                name: "Does Not Exist",
                department: "Testing",
                salary: 50000
            });

        expect(response.statusCode).toBe(404);
    });
});

//--- Validation tests
describe("POST /employees - validation", () => {
    test("should return 400 when required fields are missing", async() => {
        const response = await request(app).post("/employees").send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        expect(response.body.details).toEqual(
            expect.arrayContaining([
                "name is required",
                "department is required",
                "salary must be a positive number"
            ])
        );
    });

    test("should return 400 when name is empty", async() => {
        const response = await request(app).post("/employees")
            .send({
                name: "",
                department: "Testing",
                salary: 999
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        expect(response.body.details).toContain("name is required");
    });

    test("should return 400 when department is empty", async() => {
        const response = await request(app).post("/employees")
            .send({
                name: "Test",
                department: "",
                salary: 999
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        expect(response.body.details).toContain("department is required");
    });

    test("should return 400 when salary is invalid", async() => {
        const response = await request(app).post("/employees")
            .send({
                name: "Test employee",
                department: "Testing",
                salary: "abc"
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        expect(response.body.details).toContain(
            "salary must be a positive number"
        );
    });

    test("should return 400 when salary is zero", async () => {
        const response = await request(app).post("/employees")
            .send({
                name: "Test employee",
                department: "Testing",
                salary: 0
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        expect(response.body.details).toContain(
            "salary must be a positive number"
        );
    });

    test("should return 400 when salary is negative", async () => {
        const response = await request(app)
            .post("/employees")
            .send({
                name: "Test Employee",
                department: "Testing",
                salary: -2
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        expect(response.body.details).toContain(
            "salary must be a positive number"
        );
    });
});

describe("PUT /employees/:id - validation", () => {
    test("should return 400 when required fields are missing", async () => {
        const response = await request(app).put("/employees/1")
            .send({});
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        // expect(response.body.details).toEqual(
        //     expect.arrayContaining([
        //         "name is required",
        //         "department is required",
        //         "salary must be a positive number"
        //     ])
        // );
    });

    test("should return 400 when salary is invalid", async() => {
        const response = await request(app).put("/employees/1")
            .send({
                name: "Updated Employee",
                department: "Testing",
                salary: "abc"
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        // expect(response.body.details).toContain(
        //     "salary must be a positive number"
        // );
    });

    test("should return 400 when salary is negative", async() => {
        const response = await request(app).put("/employees/1")
            .send({
                name: "Updated Employee",
                department: "Testing",
                salary: -1000
            });
        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe("Validation failed");
        // expect(response.body.details).toContain(
        //     "salary must be a positive number"
        // );
    });
})