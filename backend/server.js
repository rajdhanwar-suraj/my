// server.js

const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const { sendMessage, voiceMessage } = require("./controllers/messageControllers");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const multer = require("multer");

dotenv.config();
connectDB();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const ioOrigins = ["http://localhost:3000", "http://localhost:5000"];
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ioOrigins,
    methods: ["GET", "POST"],
  },
});

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

// Multer setup to handle audio file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/api/message", sendMessage(io));
app.post("/api/voice", upload.single("audio"), voiceMessage(io));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`);
});
