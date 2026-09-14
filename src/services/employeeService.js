const pool = require("../db/db");
const {
    getCacheVersion,
    invalidateEmployeeCache,
    getCachedEmployee,
    cacheEmployees
} = require("../cache/emloyeeCache");


async function createEmployee(name, department, salary){
    const result = await pool.query(
        `INSERT INTO employees (name, department, salary)
        VALUES ($1, $2, $3)
        RETURNING *`,
        [name, department, salary]
    );

    await invalidateEmployeeCache();

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

    //cache key
    const version = await getCacheVersion();
    const cacheKey = [
        "employees",
        `v${version}`,
        department || "",
        search || "",
        page,
        limit,
        sortBy || "id",
        order || "asc"
    ].join(":");

    const cachedEmployees = await getCachedEmployee(cacheKey);
    if(cachedEmployees){
        console.log("Employees cache HIT:", cacheKey);
        return cachedEmployees;
    }
    console.log("Employees cache MISS:", cacheKey);

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


    const response = {
        data: dataResult.rows,
        pagination: {
            page,
            limit,
            total,
            totalPages
        }
    };

    await cacheEmployees(cacheKey, response);

    // return result.rows;
    // return {
    //     data: dataResult.rows,
    //     pagination: {
    //         page,
    //         limit,
    //         total,
    //         totalPages
    //     }
    // };
    return response;
}

async function getEmployeeById(id){
    const result = await pool.query(
        "SELECT * FROM employees WHERE id = $1",
        [id]
    );
    return result.rows[0];
}

async function updateEmployee(id, name, department, salary) {
    const result = await pool.query(
        `UPDATE employees
         SET name = $1,
             department = $2,
             salary = $3
         WHERE id = $4
         RETURNING *`,
        [name, department, salary, id]
    );

    if(result.rows[0]){ await invalidateEmployeeCache(); }

    return result.rows[0];
}

async function deleteEmployee(id) {
    const result = await pool.query(
        `DELETE FROM employees
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    if(result.rows[0]){ await invalidateEmployeeCache(); }

    return result.rows[0];
}

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};