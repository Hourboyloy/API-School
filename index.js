require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connection = require("./src/database/connection");
const user_route = require("./src/route/user.route");
const news_route = require("./src/route/news.route");
const background_route = require("./src/route/background.route");
const Categories = require("./src/route/categories.route");
const ViewsAnalysis = require("./src/route/ViewsAnalysis.route");

const app = express();

// Setup CORS policy
app.use(
  cors({
    // origin: [
    //   "https://manage-news-client134.vercel.app",
    //   "https://news-olive-nine.vercel.app",
    // ],
    origin: "*",
    methods: "GET,POST,DELETE,PUT",
  })
);

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Middleware and routes
app.use(express.json());

connection.mymongodb();
user_route(app);
news_route(app);
background_route(app);
Categories(app);
ViewsAnalysis(app);

// Start the server
const PORT = process.env.PORT_LISTEN;
app.listen(PORT, () => {
  console.log(`Listening`);
});
