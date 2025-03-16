import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "ai"], required: true }, // Identify sender
  text: { type: String, required: true }, // Store text messages
  timestamp: { type: Date, default: Date.now },
});

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Store user ID from OAuth
  conversationId: { type: String, required: true }, // Unique ID per conversation
  messages: [MessageSchema], // Array of messages
});

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
