require("dotenv").config();

const app = require("./src/app");
const { connectRedis } = require("./src/cache/redis");

const PORT = process.env.PORT || 3000;


async function startServer(){
    await connectRedis();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    })
}

startServer();

