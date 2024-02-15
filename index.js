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

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
    console.log("Received exercise data:", req.body);
    console.log("User ID:", userId);

    // Check if duration is provided and is a valid integer
    if (!duration || isNaN(parseInt(duration))) {
      throw new Error("Duration is missing or invalid");
    }

    const userIndex = users.findIndex((u) => u._id === userId);
    if (userIndex === -1) throw new Error("User not found");
    console.log("Found user:", users[userIndex]);

    const exercise = {
      description,
      duration: parseInt(duration),
      date: date ? new Date(date) : new Date(),
      _id: Date.now().toString(),
      userId,
    };
    console.log("Created exercise:", exercise);

    exercises.push(exercise);

    // Add the exercise to the user's log
    if (!users[userIndex].log) {
      users[userIndex].log = [];
    }
    users[userIndex].log.push(exercise);
    console.log("Updated user object:", users[userIndex]);

    // Return the exercise object in the required format
    res.json({
      _id: exercise._id,
      username: users[userIndex].username,
      date: exercise.date.toDateString(), // Format the date as required
      duration: exercise.duration,
      description: exercise.description,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const user = users.find((u) => u._id === userId);
    if (!user) throw new Error("User not found");

    let userExercises = exercises.filter((e) => e.userId === userId);

    // Parse query parameters
    const { from, to, limit } = req.query;

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






app.post("/api/users/:userId/exercises", async (req, res) => {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params.userId;

    const user = users.find((u) => u._id === userId);
    if (!user) {
      throw new Error("User not found");
    }

    const exerciseDate = date ? new Date(date) : new Date();
    const formattedDate = exerciseDate.toDateString();

    const exercise = {
      username: user.username,
      _id: user._id,
      date: formattedDate,
      duration: parseInt(duration),
      description,
    };

    // Add the exercise to the exercises array
    exercises.push(exercise);

    // Return the exercise object
    res.json(exercise);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
*/
