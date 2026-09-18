const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const {
    getEmployees,
    createEmployeeController,
    getEmployeeByIdController,
    updateEmployeeController,
    deleteEmployeeController
} = require("../controllers/employeeController");

const validateEmployee = require("../middleware/validateEmployee");
const validateEmployeeQuery = require("../middleware/validateEmployeeQuery");

router.get("/", authenticate, validateEmployeeQuery, getEmployees);

router.get("/:id", authenticate, getEmployeeByIdController);

router.post("/", authenticate, authorize("admin"), validateEmployee, createEmployeeController);

router.put("/:id", authenticate, authorize("admin"), updateEmployeeController);

router.delete("/:id", authorize("admin"), deleteEmployeeController);

module.exports = router;
