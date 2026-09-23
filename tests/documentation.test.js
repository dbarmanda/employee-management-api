const request = require("supertest");
const app = require("../src/app");

describe("API Documentation", () => {

    test("GET /api-docs.json returns the OpenAPI specification", async () => {

        const response = await request(app)
            .get("/api-docs.json");

        expect(response.statusCode).toBe(200);

        expect(response.body.openapi).toBe("3.0.3");

        expect(response.body.info.title)
            .toBe("Employee Management API");

        expect(response.body.paths)
            .toHaveProperty("/employees");

        expect(response.body.paths)
            .toHaveProperty("/auth/login");
    });

});
