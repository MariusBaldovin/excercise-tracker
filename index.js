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

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration } = req.body;
  let { date } = req.body;

  // Check if required fields are present
  if (!description || !duration) {
    return res
      .status(422)
      .json({ error: "Description and duration are required" });
  }

  // Find the user by ID
  const foundUser = users.find((user) => user._id === userId);

  if (!foundUser) {
    return res.status(404).json({ error: "User not found" });
  }

  // Validate and format the date
  if (!date || isNaN(Date.parse(date))) {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }

  // Convert duration to integer
  const parsedDuration = parseInt(duration);

  // Check if duration is a valid number
  if (isNaN(parsedDuration) || parsedDuration <= 0) {
    return res
      .status(422)
      .json({ error: "Duration must be a valid positive number" });
  }

  // Update user log
  const log = {
    description,
    duration: parsedDuration,
    date,
  };
  exercises.push(log);

  // Prepare response
  const response = {
    _id: foundUser._id,
    username: foundUser.username,
    date,
    duration: parsedDuration,
    description,
  };

  res.json(response);
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;
    const user = users.find((u) => u._id === userId);
    if (!user) throw new Error("User not found");

    let userExercises = exercises.filter((e) => e.userId === userId);

    // Apply date range filtering
    if (from || to) {
      const fromDate = from ? new Date(from) : null;
      const toDate = to ? new Date(to) : null;
      userExercises = userExercises.filter((e) => {
        const exerciseDate = new Date(e.date);
        if (fromDate && toDate) {
          return exerciseDate >= fromDate && exerciseDate <= toDate;
        } else if (fromDate) {
          return exerciseDate >= fromDate;
        } else {
          return exerciseDate <= toDate;
        }
      });
    }

    // Apply limit filtering
    if (limit) {
      userExercises = userExercises.slice(0, parseInt(limit));
    }

    // Format the date property for each exercise
    userExercises = userExercises.map((e) => ({
      ...e,
      date: e.date.toDateString(),
    }));

    res.json({
      username: user.username,
      _id: user._id,
      count: userExercises.length,
      log: userExercises,
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

/*const express = require("express");
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
    res.json({ ...user, ...exercise });
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
    res.json({
      username: user.username,
      _id: user._id,
      count: userExercises.length,
      log: userExercises,
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
*/
