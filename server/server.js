const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// const middleware = require("middleware");

dotenv.config({ path: "./.env" });
const secretKey = process.env.SECRET_KEY;

const app = express();

import("node-fetch").then((fetchModule) => {
  const fetch = fetchModule.default;

  app.use(cors());
  app.use(bodyParser.json());

// Middleware to track API usage
app.use(async (req, res, next) => {
  const userId = req.user ? req.user.username : null;

  // Insert into api_stats table
  const apiStatsQuery =
    "INSERT INTO api_stats (method, endpoint, timestamp) VALUES (?, ?, NOW())";
  await db.query(apiStatsQuery, [req.method, req.originalUrl]);

  // Insert into user_api_consumption table if userId is available
  if (userId) {
    const userApiConsumptionQuery =
      "INSERT INTO user_api_consumption (username, email, token, timestamp) VALUES (?, ?, ?, NOW())";
    await db.query(userApiConsumptionQuery, [
      userId,
      req.user.email,
      req.user.token,
    ]);
  }

  next(); // Continue to the next middleware or route handler
});

// Additional middleware to track API usage counters
const apiStats = {};
const userApiConsumption = {};

app.use((req, res, next) => {
  const userId = req.user ? req.user.username : null;
  const endpoint = req.originalUrl;
  const method = req.method;

  // Increment the counter for the specific endpoint
  if (!apiStats[method]) {
    apiStats[method] = {};
  }

  if (!apiStats[method][endpoint]) {
    apiStats[method][endpoint] = 1;
  } else {
    apiStats[method][endpoint]++;
  }

  // Increment user API consumption if userId is available
  if (userId) {
    if (!userApiConsumption[userId]) {
      userApiConsumption[userId] = {};
    }

    if (!userApiConsumption[userId][method]) {
      userApiConsumption[userId][method] = {};
    }

    if (!userApiConsumption[userId][method][endpoint]) {
      userApiConsumption[userId][method][endpoint] = 1;
    } else {
      userApiConsumption[userId][method][endpoint]++;
    }
  }

  next();
});


  const db = mysql.createConnection({
    host: process.env.HOST,
    port: "3306",
    user: "admin",
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
  });

  db.connect((err) => {
    if (err) {
      console.log(err.message);
      return;
    }
    console.log("Database connected.");
  });

  app.post("/register", async (req, res) => {
    const { username, email, password } = req.body;
    const role = "user"; // Default role for users

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const query = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
      db.query(
        query,
        [username, email, hashedPassword, role],
        (err, results) => {
          if (err) {
            console.error(err);
            res.status(500).send("Error registering new user");
          } else {
            console.log("New user registered", results);
            res.status(201).send("New user registered");
          }
        }
      );
    } catch (error) {
      console.error("Error hashing password:", error);
      res.status(500).send("Error hashing password");
    }
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT * FROM users WHERE username = ?`;
    db.query(query, [username], async (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error logging in user");
        return;
      }

      if (results.length > 0) {
        const user = results[0];

        try {
          const match = await bcrypt.compare(password, user.password);
          if (match) {
            console.log("Login successful for user:", username);

            const token = jwt.sign({ username, role: user.role }, secretKey, {
              expiresIn: "1h",
            });

            res.status(200).json({ token, role: user.role });
          } else {
            console.log("Password does not match for user:", username);
            res.status(401).send("Password incorrect");
          }
        } catch (error) {
          console.error("Error comparing passwords:", error);
          res.status(500).send("Error comparing passwords");
        }
      } else {
        console.log("No user found with username:", username);
        res.status(404).send("User not found");
      }
    });
  });

  const verifyRole = (requiredRole) => (req, res, next) => {
    const userRole = req.user ? req.user.role : null;
  
    console.log("Required Role:", requiredRole);
    console.log("User Role:", userRole);
  
    if (userRole === requiredRole) {
      next(); 
    } else {
      res.status(403).send("Forbidden");
    }
  };
  

  app.get("/admin/users", verifyRole("admin"), (req, res) => {
    res.status(200).send("Admin-only access");
  });

  app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error retrieving users");
      } else {
        console.log("Users:", results);
        res.status(200).json(results);
      }
    });
  });

  async function querySentiment(data, userId) {
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/siebert/sentiment-roberta-large-english",
        {
          headers: {
            Authorization: "Bearer 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",
          },
          method: "POST",
          body: JSON.stringify(data),
        }
      );
  
      const result = await response.json();
  
      // Log the actual response
      console.log("Actual Response from Sentiment Analysis Model:", result);
  
      // Ensure the response has the expected structure
      if (
        result &&
        Array.isArray(result) &&
        result[0] &&
        Array.isArray(result[0])
      ) {
        const innerArray = result[0];
  
        // Find the sentiment label with the highest score
        const maxScoreSentiment = innerArray.reduce(
          (maxScoreLabel, currentLabel) => {
            return currentLabel.score > maxScoreLabel.score
              ? currentLabel
              : maxScoreLabel;
          }
        );
  
        // Insert into api_stats table
        const apiStatsQuery =
          "INSERT INTO api_stats (method, endpoint, timestamp) VALUES (?, ?, NOW())";
        await db.query(apiStatsQuery, [data.method, data.endpoint]);
  
        // Insert into user_api_consumption table if userId is available
        if (userId) {
          const userApiConsumptionQuery =
            "INSERT INTO user_api_consumption (username, email, token, timestamp) VALUES (?, ?, ?, NOW())";
          await db.query(userApiConsumptionQuery, [
            userId,
            user.email, // Replace with the actual column name for email
            user.token, // Replace with the actual column name for token
          ]);
        }
  
        return maxScoreSentiment;
      } else {
        throw new Error(
          "Unexpected response format from the sentiment analysis model."
        );
      }
    } catch (error) {
      console.error("Error querying sentiment:", error);
      throw error;
    }
  }
  

  app.get("/loading", (req, res) =>{
    res.sendFile(__dirname + "/login.html")
  });

  app.post("/sentiment", async (req, res) => {
    const { inputs } = req.body;
    const userId = req.user ? req.user.username : null;

    try {

      const result = await querySentiment({ inputs: inputs });

      res.status(200).json(result);
    } catch (error) {
      console.error("Error querying sentiment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

  app.get("/admin/api/stats", verifyRole("admin"), (req, res) => {
    const queryApiStats =
      "SELECT method, endpoint, COUNT(*) as requests FROM api_stats GROUP BY method, endpoint";
    db.query(queryApiStats, (err, apiStats) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.status(200).json(apiStats);
      }
    });
  });

  app.get("/admin/user/api/consumption", verifyRole("admin"), (req, res) => {
    const queryUserApiConsumption =
      "SELECT username, email, token, COUNT(*) as totalRequests FROM user_api_consumption GROUP BY username, email, token";
    db.query(queryUserApiConsumption, (err, userApiConsumption) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.status(200).json(userApiConsumption);
      }
    });
  });
  
app.delete("/users/:username", verifyRole("admin"), (req, res) => {
  const usernameToDelete = req.params.username;

  // Check if the user exists
  db.query("SELECT * FROM users WHERE username = ?", [usernameToDelete], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    } else {
      if (results.length > 0) {
        // User found, proceed with deletion
        db.query("DELETE FROM users WHERE username = ?", [usernameToDelete], (deleteErr, deleteResult) => {
          if (deleteErr) {
            console.error(deleteErr);
            res.status(500).json({ error: "Error deleting user" });
          } else {
            console.log("User deleted:", usernameToDelete);
            res.status(200).json({ message: "User deleted successfully" });
          }
        });
      } else {
        // User not found
        res.status(404).json({ error: "User not found" });
      }
    }
  });
});


  app.listen(5001, () => {
    console.log("The app is listening on 5001.");
  });
});
