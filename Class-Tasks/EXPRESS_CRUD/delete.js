const express=require('express');
const app=express();

app.use(express.json());

let students=[
    {id:1,name:"adv",marks:50,city:"Delhi"} /*0*/,
    {id:2,name:"ayo",marks:70,city:"Mumbai"} /*1*/,
    {id:3,name:"aaru",marks:87,city:"Bangalore"} /*2*/
];
//view
app.get("/students",(req,res)=>{
    res.json(students);
});
// delete - remove student by id (only if marks < 70)
app.delete("/students/:id", (req, res) => {
    const id = req.params.id;

    const studentIndex = students.findIndex((s) => s.id == id);

    if (studentIndex === -1) {
        return res.status(404).json({ message: "Student not found" });
    }

    const student = students[studentIndex];

    // Condition: allow delete only if marks < 70
    if (student.marks >= 70) {
        return res.status(400).json({
            message: "Cannot delete student. Only students with marks less than 70 can be deleted."
        });
    }

    const deletedStudent = students.splice(studentIndex, 1);

    res.json({
        message: "Student deleted successfully",
        student: deletedStudent[0]
    });
});
app.listen(8000,()=>console.log("Server is running on port 8000"));