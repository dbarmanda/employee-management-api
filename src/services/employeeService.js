const pool = require("../db/db");

async function createEmployee(name, department, salary){
    const result = await pool.query(
        `INSERT INTO employees (name, department, salary)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [name, department, salary]
    );

    return result.rows[0];
}

module.exports = {
    createEmployee
};