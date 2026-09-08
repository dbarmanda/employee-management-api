const { Pool } = require("pg");

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "employee_user",
    password: "employee_password",
    database: "employee_db"
});

module.exports = pool;