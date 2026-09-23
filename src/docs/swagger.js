const swaggerJsdoc = require("swagger-jsdoc");

const options = {
    definition: {
        openapi: "3.0.3",

        info: {
            title: "Employee Management API",
            version: "1.0.0",
            description:
                "REST API for employee management with PostgreSQL, Redis caching, JWT authentication, role-based authorization, rate limiting, background jobs, and transactional outbox processing."
        },

        servers: [
            {
                url: "http://localhost:3000",
                description: "Local development server"
            }
        ],

        tags: [
            {
                name: "Authentication",
                description: "User registration and authentication"
            },
            {
                name: "Employees",
                description: "Employee management operations"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },

            schemas: {
                Employee: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            example: 1
                        },
                        name: {
                            type: "string",
                            example: "Alice Johnson"
                        },
                        department: {
                            type: "string",
                            example: "IT"
                        },
                        salary: {
                            type: "number",
                            format: "double",
                            example: 75000
                        }
                    }
                },

                EmployeeInput: {
                    type: "object",
                    required: [
                        "name",
                        "department",
                        "salary"
                    ],
                    properties: {
                        name: {
                            type: "string",
                            example: "Alice Johnson"
                        },
                        department: {
                            type: "string",
                            example: "IT"
                        },
                        salary: {
                            type: "number",
                            format: "double",
                            example: 75000
                        }
                    }
                },

                LoginRequest: {
                    type: "object",
                    required: [
                        "email",
                        "password"
                    ],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "admin@example.com"
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "password123"
                        }
                    }
                },

                RegisterRequest: {
                    type: "object",
                    required: [
                        "email",
                        "password"
                    ],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com"
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "password123"
                        }
                    }
                },

                Error: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            example: "Employee not found"
                        },
                        requestId: {
                            type: "string",
                            format: "uuid"
                        }
                    }
                }
            }
        }
    },

    apis: [
        "./src/routes/*.js"
    ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;