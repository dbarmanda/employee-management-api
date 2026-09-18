const bcrypt = require("bcryptjs");
const request = require("supertest");

const app = require("../../src/app");
const pool = require("../../src/db/db");

const testUser = {
    email: "auth-test@example.com",
    password: "Password123"
};

const testAdmin = {
    email: "admin-test@example.com",
    password: "Password123"
};

async function createTestUser(){
    const passwordHash = await bcrypt.hash(testUser.password, 12);
    await pool.query(
        `INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, 'user')
        ON CONFLICT (email)
        DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role='user'
        `,
        [testUser.email, passwordHash]
    );
}

async function createTestAdmin(){
    const passwordHash = await bcrypt.hash(testAdmin.password, 12);
    await pool.query(
        `INSERT INTO users (email, password_hash, role)
        VALUES ($1, $2, 'admin')
        ON CONFLICT (email)
        DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role = 'admin'
        `,
        [testAdmin.email, passwordHash]
    );
}

async function login(email, password){
    const response = await request(app).post("/auth/login")
        .send({
            email,
            password
        });
    return response.body.token;
}

async function setupTestAuth(){
    await createTestUser();
    await createTestAdmin();

    const userToken = await login(testUser.email, testUser.password);
    const adminToken = await login(testAdmin.email, testAdmin.password);

    return {
        userToken,
        adminToken
    };
}

async function cleanupTestAuth(){
    await pool.query(
        `DELETE FROM users WHERE email in ($1, $2)`,
        [testUser.email, testAdmin.email]
    );
}

module.exports = {
    testUser,
    testAdmin,
    setupTestAuth,
    cleanupTestAuth
}
