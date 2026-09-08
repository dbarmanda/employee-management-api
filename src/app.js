const express = require("express");

const employeeRoutes = require("./routes/employeeRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
app.use(express.json());

const PORT = 3000;

app.get("/", (req, res) => {
    // res.send("Employee Management API");<--- before introducing express.json()
    res.json({
        message: "Employee Management API"
    });
});

app.use("/employees", employeeRoutes);

// app.get("/test-error", (req, res, next) => {
//     const error = new Error("Something went wrong");

//     next(error);
// });

// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// }); --> moved to server.js

app.use(errorHandler);

module.exports = app;