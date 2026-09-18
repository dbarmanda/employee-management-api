const {
    registerUser,
    loginUser
} = require("../services/authService");

async function register(req, res, next){
    try {
        const {email, password} = req.body;
        if(!email || !email.trim()){
            return res.status(400).json({
                error: "Validation failed",
                details: ["email is required"]
            });
        }
        if(!password){
            return res.status(400).json({
                error: "Validation failed",
                details: ["password is required"]
            });
        }
        if(password.length < 8){
            return res.status(400).json({
                error: "Validation failed",
                details: ["password must be at least 8 characters"]
            });
        }

        const user = await registerUser(email.trim().toLowerCase(), password);

        res.status(201).json({user});
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next){
    try {
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                error: "Validation failed",
                details: ["email and password are required"]
            });
        }
        const result = await loginUser(email.trim().toLowerCase(), password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login
};
