const express = require('express');
const router = express.Router();
const Student = require('../models/student');

// add
router.post('/', async (req, res) => {
    const student = await Student.create(req.body);
    res.json(student);
});

// view all
router.get('/', async (req, res) => {
    const students = await Student.find();
    res.json(students);
});

// find by email
router.get('/email/:email', async (req, res) => {
    const student = await Student.findOne({ email: req.params.email });
    res.json(student);
});

// update GPA
router.put('/:id', async (req, res) => {
    const student = await Student.findByIdAndUpdate(
        req.params.id,
        { gpa: req.body.gpa },
        { new: true }
    );
    res.json(student);
});

// delete
router.delete('/:id', async (req, res) => {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

module.exports = router;