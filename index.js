const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

// In-memory data storage
let users = [];
let exercises = [];

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/api/users", async (req, res) => {
  try {
    const { username } = req.body;
    const newUser = { username, _id: Date.now().toString() };
    users.push(newUser);
    res.json(newUser);
  } catch (error) {
    res.status(400).json({ error: "Failed to create new user" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: "Failed to retrieve users" });
  }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
    const user = users.find((u) => u._id === userId);
    if (!user) throw new Error("User not found");

    const newExercise = {
      description,
      duration: parseInt(duration),
      date: date ? new Date(date).toDateString() : new Date().toDateString(),
      _id: Date.now().toString(),
      userId,
    };
    exercises.push(newExercise);
    res.json({ ...user, ...newExercise });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const user = users.find((u) => u._id === userId);
    if (!user) throw new Error("User not found");

    const userExercises = exercises.filter((e) => e.userId === userId);
    // Format date as string using toDateString() method
    const formattedExercises = userExercises.map((exercise) => ({
      ...exercise,
      date: new Date(exercise.date).toDateString(),
    }));
    res.json({
      username: user.username,
      _id: user._id,
      count: formattedExercises.length,
      log: formattedExercises,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
