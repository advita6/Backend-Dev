const express = require('express');
const { message } = require('statuses');
const app = express();

//built in middleware
app.use(express.json()); // Parse JSON bodies  
app.use(express.urlencoded({extended:true})); // Parse URL-encoded bodies

app.use((req,res,next) => {
    console.log("request url is ", req.url);
    console.log("request method is ", req.method);
    next(); // Pass control to the next middleware
});

app.get("/home", (req, res) => {
    res.send("Welcome to the home page");
});

//route specific middleware
const checkLogin = (req,res,next) => {
    const isLoggedIn = true; // Simulating a login check
    if(!isLoggedIn){
        return res.status(401).send("Unauthorized");
    }
    next();
};
app.get("/dashboard", checkLogin, (req, res) => {
    res.send("Welcome to the dashboard");
});
//authentication middleware
const autthMiddleware = (req,res,next) => {
    const token = req.headers.authorization;
    if(!token){
        return res.status(403).json({message:"token required"});
    }
    if(token !== "advu"){
        return res.status(401).json({message:"invalid token"});
    }
    next();
};
    app.get("/profile", autthMiddleware, (req, res) => {
        res.json({message:"Profile data"});
    });


//error handling middleware
app.get("/error", (req, res) => {
    throw new Error("Something went wrong!");
});
app.use((err, req, res, next) => {
    console.log("Error middleware", err.message);
    res.status(500).json({
        message: "Internal Server Error"});
    });
app.listen(8000, () => {
    console.log("Server is running on port 8000");
});