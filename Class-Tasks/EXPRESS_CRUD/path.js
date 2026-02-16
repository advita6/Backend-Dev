const express = require('express');
const app = express();

app.use(express.json());

let students = [
    { id: 1, name: "adv", marks: 20, city: "Delhi" },
    { id: 2, name: "ayo", marks: 30, city: "Mumbai" },
    { id: 3, name: "aaru", marks: 25, city: "Bangalore" }
];

// GET all students
app.get("/students", (req, res) => {
    res.json(students);
});

// PATCH - allow update only for marks
app.patch("/students/:id", (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    const student = students.find((s) => s.id == id);

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    const updateKeys = Object.keys(updates);

    if (updateKeys.length !== 1 || updateKeys[0] !== "marks") {
        return res.status(400).json({
            message: "Only marks can be updated."
        });
    }

    if (typeof updates.marks !== "number") {
        return res.status(400).json({
            message: "Marks must be a number"
        });
    }

    student.marks = updates.marks;

    res.json({
        message: "Marks updated successfully",
        student
    });
});

app.listen(8000, () => {
    console.log("Server is running on port 8000");
});
