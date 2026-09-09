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

const {
    createEmployee,
    getEmployees: getEmployeesFromService
} = require("../services/employeeService");

// async function getEmployees(req, res, next){
//     try {
//         const result = await pool.query(
//             "SELECT * FROM employees ORDER BY id"
//         );
//         res.status(200).json(result.rows);
//     } catch (error) {
//         next(error);
//     }
// }

async function getEmployees(req, res, next){
    try {
        const{
            department, search, sortBy = "id", order = "asc"
        } = req.query;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
 
        // if(page < 1 || limit < 1){
        //     return res.status(400).json({
        //         error: "Page and limit must be positive numbers"
        //     });
        // }

        const employees = await getEmployeesFromService({
            department, search, page, limit, sortBy, order
        });

        res.status(200).json(employees);

    } catch (error) {
        next(error);
    }
}

async function createEmployeeController(req, res, next){
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