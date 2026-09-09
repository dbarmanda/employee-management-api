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

async function getEmployees(options){
    const {
        department,
        search,
        page,
        limit,
        sortBy,
        order
    } = options;

    const values = [];
    const conditions = [];

    if(department){
        values.push(department);
        conditions.push(`department = $${values.length}`);
    }

    if(search){
        values.push(`%${search}%`);
        conditions.push(`name ILIKE $${values.length}`);
    }

    const whereClause = 
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

    const allowedSortColumns = [
        "id",
        "name",
        "department",
        "salary"
    ];

    const safeSortBy = allowedSortColumns.includes(sortBy)
        ? sortBy
        : "id";

    const safeOrder = 
        order === "desc"
            ? "DESC"
            : "ASC";

    const offset = (page - 1) * limit;

    const dataValues = [...values];
    
    // values.push(limit);
    dataValues.push(limit);
    const limitPlaceholder = `$${dataValues.length}`;

    // values.push(offset);
    dataValues.push(offset);
    const offsetPlaceholder = `$${dataValues.length}`;

    const dataQuery = `
        SELECT * FROM employees
        ${whereClause}
        ORDER BY ${safeSortBy} ${safeOrder}
        LIMIT ${limitPlaceholder}
        OFFSET ${offsetPlaceholder}
    `;

    const countQuery = `SELECT COUNT(*) AS total
        FROM employees
        ${whereClause}`;

    // const result = await pool.query(dataQuery, values);
    const [dataResult, countResult] = await Promise.all([
        pool.query(dataQuery, dataValues),
        pool.query(countQuery, values)
    ]);

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total/limit);

    // return result.rows;
    return {
        data: dataResult.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };
}

module.exports = {
    createEmployee,
    getEmployees
};