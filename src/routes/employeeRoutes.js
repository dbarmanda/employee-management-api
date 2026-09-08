const express = require("express");
const router = express.Router();

const {
    getEmployees,
    createEmployeeController
} = require("../controllers/employeeController");

const validateEmployee = require("../middleware/validateEmployee");

router.get("/", getEmployees);

router.post("/", validateEmployee, createEmployeeController);

module.exports = router;