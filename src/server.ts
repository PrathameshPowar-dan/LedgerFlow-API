import express from "express";
import ConnectDB from "./database/db";

const app = express();

app.use(express.json());


app.get("/", (req, res) => {
    res.send("Hello, World!");
});

// Connect to the database and start the server
ConnectDB().then(() => {
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
})
    .catch((err) => {
        console.log("Server Error: ", err)
    })