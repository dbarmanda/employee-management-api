const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/db/db");

const {
    testUser,
    testAdmin,
    setupTestAuth,
    cleanupTestAuth
} = require("./helpers/testAuth");

const bcrypt = require("bcryptjs");

let auth;

beforeAll(async () => {
    auth = await setupTestAuth();
});
afterAll(async() => {
    await cleanupTestAuth();
});

async function createTestUser(testEmail, testPassword){
    const passwordHash = await bcrypt.hash(
            testPassword,
            12
        );
        await pool.query(`
            INSERT INTO users (email, password_hash, role)
            VALUES ($1, $2, 'user')
            ON CONFLICT (email)
            DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                role='user'
            `,
        [testEmail, passwordHash]);
}

async function deleteTestUser(testEmail){
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
}
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
        const response = await request(app).get("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.userToken}`
            );
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .get("/employees/1")
            .set(
                "Authorization",
                `Bearer ${auth.userToken}`
            );

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("id", 1);
        expect(response.body).toHaveProperty("name");
        expect(response.body).toHaveProperty("department");
        expect(response.body).toHaveProperty("salary");
    });

    test("should return 404 when employee does not exist", async() => {
        const response = await request(app).get("/employees/99999")
            .set(
                "Authorization",
                `Bearer ${auth.userToken}`
            );
        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /employees/:id", () => {
    test("should update an employee", async() => {
        //Create test employee
        const createResponse = await request(app)
            .post("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
        const response = await request(app).post("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            ).send({});

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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
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
});

describe("Request IDs", () => {
    test("should generate a request ID when one is not provided", async() => {
        const response = await request(app).get("/");
        expect(response.statusCode).toBe(200);
        expect(response.headers["x-request-id"]).toBeDefined();
        expect(response.headers["x-request-id"]).not.toBe("");
    });

    test("should preserve an existing request ID", async() => {
        const response = await request(app).get("/")
            .set("X-Request-ID", "test-request-123");

        expect(response.statusCode).toBe(200);
        expect(response.headers["x-request-id"])
            .toBe("test-request-123");
    });
});

describe("Centralized error handling", () => {
    test("should return 404 with request ID for missing employee", async () => {
        const response = await request(app).get("/employees/9999")
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            );
        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe("Employee not found");
        expect(response.body.requestId).toBeDefined();
    });
});


describe("Redis caching", () => {
    test("should return employees successfully", async() =>{
        const response = await request(app)
            .get("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
            .query({
                page: 1,
                limit: 5
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
    });

    test("should return the same cached response for repeated requests", async() => {
        const firstResponse = await request(app).get("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
            .query({
                page: 1,
                limit: 5
            });
        const secondResponse = await request(app).get("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.adminToken}`
            )
            .query({
                page: 1,
                limit: 5
            });
        expect(secondResponse.statusCode).toBe(200);
        expect(secondResponse.body).toEqual(firstResponse.body);
    });
});

//Authentication Test
describe("Authentication", () => {
    

    test("should reject request without authentication", async() => {
        const response = await request(app)
            .get("/employees");
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe(
            "Authentication required"
        );
        expect(response.body.requestId).toBeDefined();
    });
    test("should reject invalid credentials", async() => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testAdmin.email,
                password: "WrongPassword"
            });
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Invalid email or password");
    });

    test("should login successfully", async() => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: testUser.email,
                password: testUser.password
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.role).toBe("user");
    });

    test("should reject malformed token", async()=>{
        const response = await request(app)
            .get("/employees")
            .set(
                "Authorization",
                "Bearer invalid-token"
            );
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe(
            "Invalid Token"
        );
    });

    
});

//Authorization Test
describe("Authorization", () => {

    test("should allow authenticated user to read employees", async()=>{
        const response = await request(app).get("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.userToken}`
            );
        expect(response.statusCode).toBe(200);
    });
    test("should reject regular user from creating employee", async() => {
        const response = await request(app).post("/employees")
            .set(
                "Authorization",
                `Bearer ${auth.userToken}`
            )
            .send({
                name: "Unauthorized employee",
                department: "IT",
                salary: 51000
            });
        expect(response.statusCode).toBe(403);
        expect(response.body.error).toBe("Forbidden");
    });
    
});
