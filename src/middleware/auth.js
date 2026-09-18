const jwt = require("jsonwebtoken");
const AppError = require("../errors/AppError");

function authenticate(req, res, next){
    try {
        const authorization = req.headers.authorization;
        if(!authorization){
            throw new AppError("Authentication required", 401);
        }
        const [scheme, token] = authorization.split(" ");
        if(scheme != "Bearer" || !token){
            throw new AppError("Invalid authorization header", 401);
        }
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decoded;
        next();
    } catch (error) { 
        if(error.name === "TokenExpiredError"){
            return next(
                new AppError("Token expired", 401)
            );
        }
        if(error.name === "JsonWebTokenError"){
            return next(
                new AppError("Invalid Token", 401)
            );
        }
        next(error);
    }
}
module.exports = authenticate;
