import express from "express";
import ConnectDB from "./database/db.ts";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());


app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Connect to the database and start the server
ConnectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
})
    .catch((err) => {
        console.log("Server Error: ", err)
    })