const http = require("http");
const fs = require("fs");

const myServer = http.createServer((req, res) => {
  let output = "";

  switch (req.url) {
    case "/":
      output = "Home page";
      break;
    case "/about":
      output = "About page";
      break;
    case "/contact":
      output = "Contact page";
      break;
    default:
      output = "404 page Not Found";
      break;
  }

  // write output.txt in SAME folder as server.js
  fs.appendFile("output.txt", output + "\n", (err) => {
    if (err) console.log("Error writing file");
  });

  res.end(output);
});

myServer.listen(8000, () => console.log("Server Started"));


