import mongoose from "mongoose";

const DB_NAME = "banking_system";

const ConnectDB = async () => {
    try {
        const ConnectionInstance = await mongoose.connect(process.env.MONGO_URI + "/" + DB_NAME as string);
        console.log(`MongoDB Connected HOSTED: ${ConnectionInstance.connection.host}`);
    } catch (error) {
        console.log("Database Connection Error:", error);
        process.exit(1);
    }
};

export default ConnectDB;