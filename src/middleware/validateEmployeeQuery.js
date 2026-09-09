function validateEmployeeQuery(req, res, next) {
    const {
        page = "1",
        limit = "10",
        order = "asc",
        sortBy = "id"
    } = req.query;

    const errors = [];

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if(!Number.isInteger(pageNumber) || pageNumber < 1){
        errors.push("page must be +ve integer");
    }

    if(!Number.isInteger(limitNumber) || limitNumber < 1){
        errors.push("limit must be between 1 and 100");
    }

    const allowedSortColumns = [
        "id", "name", "department", "salary"
    ];

    if(!allowedSortColumns.includes(sortBy)){
        errors.push("sortBy must be one of: id, name, department or salary");
    }

    if (order !== "asc" && order !== "desc") {
        errors.push("order must be either asc or desc");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            error: "Invalid query parameters",
            details: errors
        });
    }

    next();
}

module.exports = validateEmployeeQuery;