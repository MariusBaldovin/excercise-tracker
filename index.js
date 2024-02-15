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

app.post(
  "/api/users/:_id/exercises",
  [
    check("description", "desc: Path `description` is required").isLength({
      min: 1,
    }),
    check("duration", "duration: Path `duration` is required with valid number")
      .matches(/^[0-9]+$/)
      .isLength({ min: 1 }),
  ],
  (req, res) => {
    let id = req.params._id;
    let desc = req.body.description;
    let dur = req.body.duration;
    let date = req.body.date;

    Alldata = dataManagement("load data");
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json(errors);
    } else if (Alldata === undefined) {
      return res.json({ data: "no data" });
    } else {
      //find input user id on existing data -> if user is exist then update user's log
      let id_Exist = Alldata.map((d) => d._id);
      let found_user = Alldata[id_Exist.indexOf(id)];

      if (found_user == undefined) {
        return res.json({ user_id: "Invalid user id" });
      } else {
        //Validate input date
        let isValidDate = Date.parse(date);
        if (isNaN(isValidDate)) {
          date = new Date().toDateString();
        } else {
          date = new Date(date).toDateString();
        }

        //Update user log
        let username = found_user.username;
        let _id = found_user._id;

        let count_Exist = parseInt(found_user.count);
        let count = (count_Exist += 1);

        let log_Exist = found_user.log;
        let log_input = { description: desc, duration: dur, date: date };
        let log = log_Exist.concat(log_input);

        user = { username: username, _id: _id, count: count, log: log };
        dataManagement("save data", user);
        return res.json({
          _id: _id,
          username: username,
          date: date,
          duration: parseInt(dur),
          description: desc,
        });
      }
    }
  }
);

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
