const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../db/db");
const AppError = require("../errors/AppError");

async function registerUser(email, password){
    const existingUser = await pool.query(
        "SELECT id FROM users WHERE EMAIL = $1", [email]
    );

    if(existingUser.rows.length > 0){
        throw new AppError("Email already registered", 409);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
        `INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, 'user')
        RETURNING id, email, role, created_at
        `,
        [email, passwordHash]
    );
    return result.rows[0];
}

async function loginUser(email, password){
    const result = await pool.query(
        `SELECT id, email, password_hash, role FROM users
        WHERE email=$1`,
        [email]
    );

    const user = result.rows[0];
    if(!user){
        throw new AppError("Invalid email or password", 401);
    }
    const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
    );
    if(!passwordMatches){
        throw new AppError("Invalid email or password", 401);
    }
    const token = jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h"
        }
    );
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role 
        }
    };
}

module.exports = {
    registerUser,
    loginUser
};
