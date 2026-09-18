const AppError = require("../errors/AppError");

function authorize(...allowedRoles){
    return (req, res, next) => {
        if(!req.user){
            return next(
                new AppError("Authentication required", 401)
            );
        }
        if(!allowedRoles.includes(req.user.role)){
            return next(
                new AppError("Forbidden", 403)
            );
        }
        next();
    };
}

module.exports = authorize;
