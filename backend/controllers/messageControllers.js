const multer = require('multer');
const upload = multer();
const fs = require('fs').promises; // Use the promises version of fs
const path = require('path');
const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const player = require('play-sound')();

const replyMessage = (userMessage, io) => {
  // Emit the user message to the connected client
  io.emit("userMessage", userMessage);

  // Set a delay of 10 seconds before sending the response
  setTimeout(() => {
    // Emit the response message to the connected client after the delay
    io.emit("responseMessage", {
      text: `I am Reply Message with ${userMessage.text}`,
    });
  }, 1000); // 10 seconds delay
};

const sendMessage = (io) => asyncHandler(async (req, res) => {
  try {
    const { text, user } = req.body;

    // Create a new message using the Message model
    const newMessage = new Message({
      text,
      user,
    });

    // Save the message to the database
    const savedMessage = await newMessage.save();

    // Call the replyMessage function and pass the io object
    replyMessage(savedMessage, io);

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const voiceMessage = (io) => asyncHandler(async (req, res) => {
  try {
    // Access the audio file buffer from req.file.buffer
    const audioBuffer = req.file.buffer;

    // Create a temporary file path
    const tempFilePath = path.join(__dirname, 'temp_audio.mp3');

    // Save the audio buffer to the temporary file
    await fs.writeFile(tempFilePath, audioBuffer);

    // Play the audio file using the play-sound library
    player.play(tempFilePath, (err) => {
      if (err) {
        console.error('Error playing audio:', err);
        res.status(500).json({ error: 'Error playing audio' });
      } else {
        console.log('Audio played successfully');
        // Clean up the temporary file after playing
        fs.unlink(tempFilePath).catch((unlinkError) => {
          console.error('Error deleting temporary file:', unlinkError);
        });
      }
    });

    // Broadcasting the voice message to all connected clients
    io.emit("voiceMessage", { audioBuffer });

    // Send a response to the client
    res.status(200).json({ message: 'Audio data received and broadcasted successfully' });
  } catch (error) {
    console.error('Error processing audio data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


module.exports = { sendMessage, voiceMessage };
