const express = require("express");
const app = express();

const cors = require("cors");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const { check, validationResult } = require("express-validator");
const fs = require("fs");

require("dotenv").config();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

function manageData(action, input) {
  let filePath = "./public/data.json";

  // Create file if not exist, then read the file
  if (!fs.existsSync(filePath)) {
    fs.closeSync(fs.openSync(filePath, "w"));
  }
  let file = fs.readFileSync(filePath);

  // Scenario for saving input into data -> append input to data.json file
  if (action == "save data" && input != null) {
    // If file is empty
    if (file.length == 0) {
      // Add new record to data.json
      return fs.writeFileSync(filePath, JSON.stringify([input], null, 2));
    }
    // If file not empty
    else if (file.length > 0) {
      let allData = JSON.parse(file.toString());
      let dataCount = allData.length;

      // Check existing record id
      let idExist = allData.map((d) => d._id);
      let checkId = idExist.includes(input._id);

      // If record id not exist, add new record
      if (!checkId) {
        allData.push(input);
        return fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
      }
      // If record id already exists, update record
      else {
        let userIndex = idExist.indexOf(input._id);
        allData.splice(userIndex, 1, input);
        return fs.writeFileSync(filePath, JSON.stringify(allData, null, 2));
      }
    } else {
      return;
    }
  }
  // Scenario for loading all data
  else if (action == "load data" && input == null) {
    if (file.length == 0) {
      return;
    } else {
      let dataArray = JSON.parse(file);
      return dataArray;
    }
  }
}

// Additional function: generate user id
function generateUserId(username) {
  let allData = manageData("load data");
  let id = uuid.v4().replace(/-/g, "").slice(0, 24);
  if (allData == undefined) {
    return id;
  } else {
    // Check existing user id and username
    let idExist = allData.map((d) => d._id);
    let nameExist = allData.map((d) => d.username);
    let checkId = idExist.includes(id);
    let checkUsername = nameExist.includes(username);
    let checkInput = checkId && checkUsername;

    if (!checkId && checkUsername) {
      generateUserId(username);
    } else if (checkId && !checkUsername) {
      return;
    } else if (!checkInput) {
      return id;
    } else {
      return;
    }
  }
}

// Additional function: load user log as requirement (from, to, and limit)
function getUserLog(foundUser, from, to, limit) {
  let checkFrom = false;
  let checkTo = false;
  let checkLimit = false;
  if (from) {
    checkFrom = !isNaN(Date.parse(from));
  }
  if (to) {
    checkTo = !isNaN(Date.parse(to));
  }
  if (limit) {
    checkLimit = /^[0-9]+$/.test(limit);
  }

  let userId = foundUser._id;
  let username = foundUser.username;
  let count = parseInt(foundUser.count);
  let logExist = foundUser.log;
  let logFormat = logExist.map((l) => {
    return {
      description: l.description,
      duration: parseInt(l.duration),
      date: l.date,
    };
  });
  let logDate = [];
  let logFinal = [];

  // Create log_format as date requirement
  if (!checkFrom && !checkTo) {
    logDate = logFormat;
  } else if (checkFrom && !checkTo) {
    logDate = logFormat.filter((d) => {
      return Date.parse(d.date) > Date.parse(from);
    });
  } else if (!checkFrom && checkTo) {
    logDate = logFormat.filter((d) => {
      return Date.parse(d.date) < Date.parse(to);
    });
  } else if (checkFrom && checkTo) {
    logDate = logFormat.filter((d) => {
      return (
        Date.parse(d.date) > Date.parse(from) &&
        Date.parse(d.date) < Date.parse(to)
      );
    });
  }

  if (checkLimit) {
    logFinal = logDate.slice(0, limit);
  } else {
    logFinal = logDate;
  }

  let userData = {
    _id: userId,
    username: username,
    count: count,
    log: logFinal,
  };
  return userData;
}

app.post(
  "/api/users",
  [
    check("username", "username: Path `username` is required").isLength({
      min: 1,
    }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.json(errors);
    } else {
      let username = req.body.username;
      let userId = generateUserId(username);
      if (userId === undefined) {
        res.json({ action: "input failed, Username already Exist" });
      } else {
        let userRecord = { username: username, _id: userId, count: 0, log: [] };
        manageData("save data", userRecord);
        return res.json({ username: username, _id: userId });
      }
    }
  }
);

app.get("/api/users", (req, res) => {
  let allData = manageData("load data");
  if (allData === undefined) {
    return res.json({ data: "no data" });
  } else {
    let data = allData.map((d) => {
      return { username: d.username, _id: d._id };
    });
    return res.json(data);
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
    let userId = req.params._id;
    let description = req.body.description;
    let duration = req.body.duration;
    let date = req.body.date;

    let allData = manageData("load data");
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.json(errors);
    } else if (allData === undefined) {
      return res.json({ data: "no data" });
    } else {
      let idExist = allData.map((d) => d._id);
      let foundUser = allData[idExist.indexOf(userId)];

      if (foundUser === undefined) {
        return res.json({ user_id: "Invalid user id" });
      } else {
        let isValidDate = Date.parse(date);
        if (isNaN(isValidDate)) {
          date = new Date().toDateString();
        } else {
          date = new Date(date).toDateString();
        }

        let username = foundUser.username;
        let userId = foundUser._id;

        let countExist = parseInt(foundUser.count);
        let count = countExist + 1;

        let logExist = foundUser.log;
        let logInput = {
          description: description,
          duration: duration,
          date: date,
        };
        let log = logExist.concat(logInput);

        let userRecord = {
          username: username,
          _id: userId,
          count: count,
          log: log,
        };
        manageData("save data", userRecord);
        return res.json({
          _id: userId,
          username: username,
          date: date,
          duration: parseInt(duration),
          description: description,
        });
      }
    }
  }
);

app.get("/api/users/:_id/logs", (req, res) => {
  let allData = manageData("load data");
  let userId = req.params._id;
  let { from, to, limit } = req.query;

  if (allData === undefined) {
    return res.json({ data: "no data" });
  } else {
    let idExist = allData.map((d) => d._id);
    let foundUser = allData[idExist.indexOf(userId)];

    if (foundUser === undefined) {
      return res.json({ user_id: "Invalid user id" });
    } else {
      let userData = getUserLog(foundUser, from, to, limit);
      return res.json(userData);
    }
  }
});

/*=========================================================================================*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
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
}); */
