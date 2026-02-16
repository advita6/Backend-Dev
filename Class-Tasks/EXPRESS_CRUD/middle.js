const express = require('express');
const app = express();

app.use((req,res,next) => {
    console.log("Middleware 1: Logging request method and URL");
    next(); // Pass control to the next middleware
});
app.use((req,res,next) => {
    console.log("Middleware 2: Adding custom header");
    next(); // Pass control to the next middleware
});
app.get("/test", (req, res) => {
    res.send("Test route");
});
app.listen(8000, () => {
    console.log("Server is running on port 8000");
});