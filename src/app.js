//Before production docker setup.
const express = require("express");

const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const requestId = require("./middleware/requestId");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");

const { generalLimiter } = require("./middleware/rateLimiter");
const { checkReadiness } = require("./health/health");

const app = express();
app.use(express.json());

app.use(requestId);
app.use(logger);
app.use(generalLimiter);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.get("/health/live", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

app.get("/health/ready", async (req, res) => {
    const readiness = await checkReadiness();
    if(!readiness.ready){
        return res.status(503).json({
            status: "not_ready",
            checks: readiness.checks
        });
    }
    return res.status(200).json({
        status: "ready",
        checks: readiness.checks
    });
})

app.get("/", (req, res) => {
    res.json({
        message: "Employee Management API"
    });
});
app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);

// app.get("/test-error", (req, res, next) => {
//     const error = new Error("Something went wrong");

//     next(error);
// });

app.use(errorHandler);

module.exports = app;

