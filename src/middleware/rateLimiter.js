const rateLimit = require("express-rate-limit");
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,

    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        error: "Too many requests, please try again later."
    }
});

const authLimiter = rateLimit({
    windowMs: 60*1000,
    limit: 10,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
        error: "Too many authentication attempts, please try again later."
    }
});

module.exports = {
    generalLimiter,
    authLimiter
}
