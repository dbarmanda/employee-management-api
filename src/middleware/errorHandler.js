function errorHandler(err, req, res, next){
    // console.error(err);
    // res.status(500).json({
    //     error: "Internal server error"
    // });

    const statusCode = err.statusCode || 500;
    const logEntry = {
        timeStamp: new Date().toISOString(),
        requestId: req.requestId,
        error: err.message,
        statusCode,
        stack: process.env.NODE_ENV === "production"
            ? undefined
            : err.stack
    };

    console.error(JSON.stringify(logEntry));
    res.status(statusCode).json({
        error: err.message || "Internal Server Error",
        ...(err.details?.length 
            ? {details: err.details}
            : {}),
        requestId: req.requestId
    });
}

module.exports = errorHandler;

