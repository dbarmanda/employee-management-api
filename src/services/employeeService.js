const AppError = require("../errors/AppError");
const pool = require("../db/db");
const {
    getCacheVersion,
    invalidateEmployeeCache,
    getCachedEmployee,
    cacheEmployees
} = require("../cache/emloyeeCache");

//X   API --> Redis
//Ok  API --> PostreSQL transaction --> outbox
//--> So, the outbox worker will eventually talk to Redis.
// const { queueEmployeeEvent } = require("../queue/employeeJobs");

const { createOutboxMessage } = require("./outboxService");


async function createEmployee(name, department, salary){
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
            `INSERT INTO employees (name, department, salary)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [name, department, salary]
        );
        const employee = result.rows[0];
        
        //await invalidateEmployeeCache();
        // await queueEmployeeEvent(
        //     "created",
        //     employee.id,
        //     {
        //         name: employee.name,
        //         department: employee.department,
        //         salary: employee.salary
        //     }
        // );

         await createOutboxMessage(client, {
            eventType: "employee.created",
            aggregateType: "employee",
            aggregateId: employee.id,
            payload: {
                id: employee.id,
                name: employee.name,
                department: employee.department,
                salary: employee.salary
            }
        });

        await client.query("COMMIT");
        await invalidateEmployeeCache();
        return employee;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally{
        client.release();
    }
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
        `department=${encodeURIComponent(department || "")}`,
        `search=${encodeURIComponent(search || "")}`,
        `page=${page}`,
        `limit=${limit}`,
        `sortBy=${sortBy || "id"}`,
        `order=${order || "asc"}`
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

    if(result.rows.length === 0)
        throw new AppError("Employee not found", 404);

    return result.rows[0];
}

async function updateEmployee(id, name, department, salary) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await client.query(
        `UPDATE employees
         SET name = $1,
             department = $2,
             salary = $3
         WHERE id = $4
         RETURNING *`,
        [name, department, salary, id]
    );

    if(result.rows.length === 0)
        throw new AppError("Employee not found", 404);

    const employee = result.rows[0];
    await createOutboxMessage(client, {
        eventType: "employee.updated",
        aggregateType: "employee",
        aggregateId: employee.id,
        payload: {
            id: employee.id,
            name: employee.name,
            department: employee.department,
            salary: employee.salary
        }
    });
    await client.query("COMMIT");
    await invalidateEmployeeCache();
    return employee;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally{
        client.release();
    }
}

async function deleteEmployee(id) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
         const result = await client.query(
            `DELETE FROM employees
            WHERE id = $1
            RETURNING *`,
            [id]
        );

        // if(result.rows[0]){ 
        //     await invalidateEmployeeCache();
        //     const employee = result.rows[0];
        //     await queueEmployeeEvent(
        //         "deleted",
        //         employee.id,
        //         {
        //             name: employee.name,
        //             department: employee.department,
        //             salary: employee.salary
        //         }
        //     ); 
        // }

        if(result.rows.length === 0)
            throw new AppError("Employee not found", 404);

        const employee = result.rows[0];
        await createOutboxMessage(client, {
            eventType: "employee.deleted",
            aggregateType: "employee",
            aggregateId: employee.id,
            payload: {
                id: employee.id,
                name: employee.name,
                department: employee.department,
                salary: employee.salary
            }
        });
        await client.query("COMMIT");

        await invalidateEmployeeCache();

        return employee;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
};

