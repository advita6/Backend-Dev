const express = require('express');
const app = express();

//buit in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.get("/", (req, res) => {
    res.render("index");
});
app.listen(8000, () => {
    console.log("Server is running on port 8000");
});