const http = require("http");

let todos = [];
let idCounter = 1;

const server = http.createServer((req, res) => {

    if (req.method === "GET" && req.url === "/todos") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(todos));
    }

    else if (req.method === "POST" && req.url === "/todos") {
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            const task = JSON.parse(body);
            task.id = idCounter++;
            todos.push(task);

            res.writeHead(201, { "Content-Type": "application/json" });
            res.end(JSON.stringify(task));
        });
    }

    else if (req.method === "PUT" && req.url.startsWith("/todos/")) {
        const id = parseInt(req.url.split("/")[2]);
        let body = "";
        req.on("data", chunk => body += chunk);
        req.on("end", () => {
            const updated = JSON.parse(body);
            const todo = todos.find(t => t.id === id);

            if (todo) {
                todo.title = updated.title;
                res.end("Updated");
            } else {
                res.writeHead(404);
                res.end("Not Found");
            }
        });
    }

    else if (req.method === "DELETE" && req.url.startsWith("/todos/")) {
        const id = parseInt(req.url.split("/")[2]);
        todos = todos.filter(t => t.id !== id);
        res.end("Deleted");
    }

    else {
        res.writeHead(404);
        res.end("Route Not Found");
    }
});

server.listen(3000, () => console.log("TODO API running on port 3000"));
