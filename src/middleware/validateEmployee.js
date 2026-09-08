function validateEmployee(req, res, next) {
    const {name, department, salary} = req.body;

    const errors = [];

    if(typeof name !== "string" || name.trim() === ""){
        errors.push("name is required");
    }
    if (
        typeof department !== "string" ||
        department.trim() === ""
    ) {
        errors.push("department is required");
    }

    if (
        salary === undefined ||
        typeof salary !== "number" ||
        !Number.isFinite(salary) ||
        salary <= 0
    ) {
        errors.push("salary must be a positive number");
    }

    //Reject unknown fields/properties of employee
    const allowedFields = ["name", "department", "salary"];

    for (const field of Object.keys(req.body)) {
        if (!allowedFields.includes(field)) {
            errors.push(`unknown field: ${field}`);
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors
        });
    }

    next();

}

module.exports = validateEmployee;