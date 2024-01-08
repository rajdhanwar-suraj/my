const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
// const userMessageMiddleware = require("./routes/userMessage");
const { sendMessage } = require("./controllers/messageControllers");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());

// Create an HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // or an array of allowed origins
    origin: "http://localhost:5000", // or an array of allowed origins
    methods: ["GET", "POST"],
  },
});

// Middleware setup
const whitelist = ["http://localhost:3000", "http://localhost:5000"];
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(cors(corsOptions));

// Routes setup
// app.use("/api/message", userMessageMiddleware(io)); // Pass io as a parameter
app.use("/api/message", sendMessage(io)); // Pass io as a parameter

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle disconnect event
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`);
});
