const http = require("http");

const myServer = http.createServer((req, res) => {
    switch (req.url) {
      case "/":
        res.writeHead(200, { "Content-Type": "text/plain" , });
        res.end("Welcome");
        break;
      case "/about":
        res.writeHead(200, { "Content-Type": "text/html" , });
        res.end("<h1>hello World</h1>");
        break;
      case "/user":
        res.writeHead(200, { "Content-Type": "application-json" , });
        res.end(JSON.stringify(user={
            username:"Rahul",
        }));
        break;
      default:
        res.end("404 page Not Found");
        break;
    }
    
 
  });
 
  myServer.listen(3000, () => console.log("Server Started"));