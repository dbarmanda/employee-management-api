const express = require("express");

const requestId = require("./middleware/requestId");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");

const employeeRoutes = require("./routes/employeeRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());

app.use(requestId);
app.use(logger);

app.get("/", (req, res) => {
    res.json({
        message: "Employee Management API"
    });
});

app.use("/employees", employeeRoutes);
app.use("/auth", authRoutes);

// app.get("/test-error", (req, res, next) => {
//     const error = new Error("Something went wrong");

//     next(error);
// });

app.use(errorHandler);

module.exports = app;

