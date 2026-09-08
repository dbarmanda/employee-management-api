const pool = require("./db");

async function testConnection(){
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("Database connected.");
        console.log(result.rows);
    } catch (error) {
        console.error("Database connection failed.");
        console.error(error.message);
    } finally{
        await pool.end();
    }
}

testConnection();