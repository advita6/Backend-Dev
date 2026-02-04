const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello page");
});

app.get("/about", (req, res) => {
  res.send("About page");
});

app.listen(8000, () => {
  console.log("Server started on port 8000");
});