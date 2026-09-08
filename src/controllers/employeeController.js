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

async function getEmployees(req, res){
    try {
        const result = await pool.query(
            "SELECT * FROM employees ORDER BY id"
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch employees from db."
        });
    }
}

module.exports = {
    getEmployees
};