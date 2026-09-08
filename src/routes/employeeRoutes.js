const express = require("express");

const router = express.Router();

const {
    getEmployees,
    createEmployeeController
} = require("../controllers/employeeController");

router.get("/", getEmployees);

router.post("/", createEmployeeController);

module.exports = router;