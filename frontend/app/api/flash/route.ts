import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MongoDB URI is missing!");
mongoose.connect(MONGO_URI);

// Define Chat History Schema
const chatSchema = new mongoose.Schema({
  messages: [String],
});
const ChatHistory = mongoose.models.ChatHistory || mongoose.model("ChatHistory", chatSchema);

export async function POST(req: NextRequest) {
  try {
    const flashApiKey = process.env.FLASH_API_KEY;
    if (!flashApiKey) {
      return NextResponse.json(
        { error: "Flash API key not found" },
        { status: 500 }
      );
    }

    const system_instruction = process.env.SYSTEM_INSTRUCTION;
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Load existing conversation history from MongoDB (or create if none exists)
    let history = await ChatHistory.findOne();
    if (!history) {
      history = await ChatHistory.create({ messages: [] });
    }

    // Add user message
    history.messages.push(`User: ${prompt}`);

    // Keep only the last 10 messages
    if (history.messages.length > 10) {
      history.messages = history.messages.slice(-10);
    }

    // Format conversation history
    const context = history.messages.join("\n");

    const genAI = new GoogleGenerativeAI(flashApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: system_instruction,
    });

    // Generate AI response
    const result = await model.generateContent(context);
    const aiResponse = await result.response.text();

    // Add AI response to history
    history.messages.push(`AI: ${aiResponse}`);

    // Save updated history
    await history.save();

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
