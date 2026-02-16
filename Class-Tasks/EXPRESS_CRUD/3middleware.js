//THIRD PARTY MIDDLEWARE
// CORS=CROSS-ORIGIN RESOURCE SHARING

const express = require("express");
const cors = require("cors");
const app = express();

//allow all origina
app.use(cors());

app.get("/data", (req, res) => {
    res.json({ message: "Cors working" });
});

app.listen(3000, () => console.log("Server is running on port 3000"));  

//specific frontend allow
//only execute react/vite
app.use(cors({
    origin: "http://localhost:5173"
}));

app.get("/data", (req, res) => {
    res.json({ message: "Cors working for specific frontend" });
});

//multiple frontend allow
const allowedOrigins = ["http://localhost:5173", "http://localhost:8000"];
app.use(cors({
    origin:allowedOrigins,
}));
