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

/**
 * @openapi
 * /employees:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get employees
 *     description: Returns employees with optional filtering, searching, sorting, and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter employees by department
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search employees by name
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - name
 *             - department
 *             - salary
 *
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *
 *     responses:
 *       200:
 *         description: Employee list returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *
 *       401:
 *         description: Authentication required
 */
router.get("/", authenticate, validateEmployeeQuery, getEmployees);

/**
 * @openapi
 * /employees:
 *   get:
 *     tags:
 *       - Employees
 *     summary: Get employees
 *     description: Returns employees with optional filtering, searching, sorting, and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter employees by department
 *
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search employees by name
 *
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum:
 *             - id
 *             - name
 *             - department
 *             - salary
 *
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum:
 *             - asc
 *             - desc
 *
 *     responses:
 *       200:
 *         description: Employee list returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *
 *       401:
 *         description: Authentication required
 */
router.get("/:id", authenticate, getEmployeeByIdController);

/**
 * @openapi
 * /employees:
 *   post:
 *     tags:
 *       - Employees
 *     summary: Create an employee
 *     description: Creates a new employee. Requires the admin role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 */
router.post("/", authenticate, authorize("admin"), validateEmployee, createEmployeeController);

/**
 * @openapi
 * /employees/{id}:
 *   put:
 *     tags:
 *       - Employees
 *     summary: Replace an employee
 *     description: Updates an employee using a complete employee representation. Requires the admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeInput'
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Employee not found
 */
router.put("/:id", authenticate, authorize("admin"), updateEmployeeController);

/**
 * @openapi
 * /employees/{id}:
 *   delete:
 *     tags:
 *       - Employees
 *     summary: Delete an employee
 *     description: Deletes an employee. Requires the admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin role required
 *       404:
 *         description: Employee not found
 */
router.delete("/:id", authenticate, authorize("admin"), deleteEmployeeController);

module.exports = router;
