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
    getEmployees: getEmployeesFromService,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
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

async function getEmployeeByIdController(req, res, next){
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id < 1){
            return res.status(400).json({
                error: "Invalid employee id"
            });
        }
        const employee = await getEmployeeById(id);

        if(!employee){
            return res.status(404).json({
                error: "Employee not found"
            });
        }

        res.status(200).json(employee);
    } catch (error) {
        next(error);
    }
}

async function updateEmployeeController(req, res, next){
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid employee id"
            });
        }

        const {
            name,
            department,
            salary
        } = req.body;

        if (
            typeof name !== "string" ||
            name.trim() === "" ||
            typeof department !== "string" ||
            department.trim() === "" ||
            typeof salary !== "number" ||
            !Number.isFinite(salary) ||
            salary <= 0
        ) {
            return res.status(400).json({
                error: "name, department and a positive salary are required"
            });
        }

        const employee = await updateEmployee(
            id,
            name,
            department,
            salary
        );

        if (!employee) {
            return res.status(404).json({
                error: "Employee not found"
            });
        }

        res.status(200).json(employee);

    } catch (error) {
        next(error);
    }
}

async function deleteEmployeeController(req, res, next) {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                error: "Invalid employee id"
            });
        }

        const employee = await deleteEmployee(id);

        if (!employee) {
            return res.status(404).json({
                error: "Employee not found"
            });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEmployees,
    createEmployeeController,
    getEmployeeByIdController,
    updateEmployeeController,
    deleteEmployeeController
};