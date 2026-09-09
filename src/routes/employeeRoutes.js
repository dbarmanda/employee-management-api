const express = require("express");
const router = express.Router();

const {
    getEmployees,
    createEmployeeController,
    getEmployeeByIdController,
    updateEmployeeController,
    deleteEmployeeController
} = require("../controllers/employeeController");

const validateEmployee = require("../middleware/validateEmployee");
const validateEmployeeQuery = require("../middleware/validateEmployeeQuery");

router.get("/", validateEmployeeQuery, getEmployees);

router.get("/:id", getEmployeeByIdController);

router.post("/", validateEmployee, createEmployeeController);

router.put("/:id", updateEmployeeController);

router.delete("/:id", deleteEmployeeController);

module.exports = router;