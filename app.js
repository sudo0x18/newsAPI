const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");

const isAuth = require("./middlewares/isAuth");

//Global Vars
const app = express();
const MONGO_URI = "mongodb://localhost:27017/news";
const PORT = 3000;

const authRouter = require("./router/authRouter");
const feedRouter = require("./router/feedRouter");

//Multer Configrations
const fileStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "public/images");
  },
  filename: (req, file, callback) => {
    callback(null, Date.now().toString() + "-" + file.originalname);
  },
});

//File filter
const fileFilter = (req, file, callback) => {
  if (
    !(
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    )
  ) {
    callback(null, false);
  }
  try {
    const token = req.get("Authorization");
    if (!token) return callback(null, false);
    const decodedToken = jwt.verify(token, "thisistoptoptopsecret");
    if (!decodedToken) {
      callback(null, false);
    }
    callback(null, true);
  } catch (err) {
    err.statusCode = 500;
    callback(err, false);
  }
};

//Middlewares
app.use(helmet());
app.use(bodyParser.json());
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);
app.use(express.static(path.join(__dirname, "public")));

//Accepting Incomming Requests
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

//Routing Requests
app.use("/auth", authRouter);
app.use("/feed", feedRouter);

//404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: "Not found",
  });
});

//Error Handler
app.use((err, req, res, next) => {
  if (!err.statusCode) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
  res.status(err.statusCode).json({
    status: false,
    message: err.message,
    error: err.data,
  });
});

mongoose.connect(
  MONGO_URI,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  },
  (err) => {
    if (err) throw err;
    app.listen(PORT, () => {
      console.log("Server started at http://127.0.0.1:" + PORT);
    });
  }
);
