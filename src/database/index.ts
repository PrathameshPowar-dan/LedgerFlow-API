import mongoose from "mongoose";
import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

const ConnectDB = async () => {
    try {
        const ConnectionInstance = await mongoose.connect(process.env.MONGO_URI!);
        console.log(`MongoDB Connected HOSTED: ${ConnectionInstance.connection.host}`);
    } catch (error) {
        console.log("Database Connection Error:", error);
        process.exit(1);
    }
};

export default ConnectDB;