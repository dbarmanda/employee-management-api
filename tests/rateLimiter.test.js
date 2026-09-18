const express = require("express");
const request = require("supertest");
const rateLimit = require("express-rate-limit");

describe("Rate limiting", () => {
    function createTestApp(){
        const app = express();
        const limiter = rateLimit({
            windowMs: 60 * 1000,
            limit: 2,
            standardHeaders: "draft-7",
            legacyHeaders: false
        });

        app.use(limiter);

        app.get("/", (req, res) => {
            res.status(200).json({
                message: "ok"
            });
        });
        return app;
    }
    test("should return 429 after the limit is exceeded", async() => {
        const app = createTestApp();

        await request(app)
            .get("/");
        await request(app)
            .get("/");
        const thirdResponse = await request(app)
            .get("/");

        expect(thirdResponse.statusCode).toBe(429);
    });
});
