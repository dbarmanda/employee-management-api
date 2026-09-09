const express = require("express");
const router = express.Router();

const {
    getEmployees,
    createEmployeeController
} = require("../controllers/employeeController");

const validateEmployee = require("../middleware/validateEmployee");
const validateEmployeeQuery = require("../middleware/validateEmployeeQuery");

router.get("/", validateEmployeeQuery, getEmployees);

router.post("/", validateEmployee, createEmployeeController);

module.exports = router;