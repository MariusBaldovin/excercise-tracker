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

// Routes
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

// POST /api/users/:_id/exercises route handler
app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
    const user = users.find((u) => u._id === userId);
    if (!user) throw new Error("User not found");

    const exercise = {
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
      _id: Date.now().toString(),
      userId,
    };
    exercises.push(exercise);

    // Construct the response according to the User and Exercise structure
    const response = { ...user, ...exercise };
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:_id/logs route handler
app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const user = users.find((u) => u._id === userId);
    if (!user) throw new Error("User not found");

    let userExercises = exercises.filter((e) => e.userId === userId);

    // Parse query parameters
    const { from, to, limit } = req.query;
    let fromDate = from ? new Date(from) : null;
    let toDate = to ? new Date(to) : null;
    let logLimit = limit ? parseInt(limit) : null;

    // Filter logs based on date range
    if (fromDate && toDate) {
      userExercises = userExercises.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= fromDate && exerciseDate <= toDate;
      });
    } else if (fromDate) {
      userExercises = userExercises.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= fromDate;
      });
    } else if (toDate) {
      userExercises = userExercises.filter((exercise) => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate <= toDate;
      });
    }

    // Limit the number of logs
    if (logLimit) {
      userExercises = userExercises.slice(0, logLimit);
    }

    // Format date as string using toDateString() method
    const formattedExercises = userExercises.map((exercise) => ({
      ...exercise,
      date: new Date(exercise.date).toDateString(), // Adjust date formatting
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
