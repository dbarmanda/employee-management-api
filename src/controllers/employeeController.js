//<---- static demo array data
// const employees = [ 
//     {
//         id: 1, name: "John", department: "IT", salary: 60000
//     },
//     {
//         id: 2, name: "Alice", department: "HR", salary: 55000
//     }
// ];

// function getEmployees(req, res){
//     res.json(employees);
// }

const pool = require("../db/db");
const {
    createEmployee
} = require("../services/employeeService");

async function getEmployees(req, res){
    try {
        const result = await pool.query(
            "SELECT * FROM employees ORDER BY id"
        );
        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
}

async function createEmployeeController(req, res){
    try {
        const {
            name,
            department,
            salary
        } = req.body;

        const employee = await createEmployee(
            name, 
            department,
            salary
        );

        res.status(200).json(employee);

    } catch (error) {
        // console.error(error);
        // res.status(500).json({
        //     error: "Failed to create employee"
        // });
        next(error);
    }
}

module.exports = {
    getEmployees,
    createEmployeeController
};