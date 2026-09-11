CREATE TABLE employees(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    salary NUMERIC(10, 2) NOT NULL
);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_employee_department_salary
ON employees(department, salary);

CREATE INDEX idx_employee_name_trgm
ON employees
USING GIN (name gin_trgm_ops);

