import express from "express";
import ConnectDB from "./database/index";
import dotenv from "dotenv";
import userRoutes from "./controllers/user/userRoutes";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.use("/api/users", userRoutes);

// Connect to the database and start the server
ConnectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
    .catch((err) => {
        console.log("Server Error: ", err)
    })