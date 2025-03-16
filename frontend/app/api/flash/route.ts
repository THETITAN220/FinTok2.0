import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import ChatHistory from "@/app/models/ChatHistory";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MongoDB URI is missing!");
mongoose.connect(MONGO_URI);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const flashApiKey = process.env.FLASH_API_KEY;
    if (!flashApiKey) {
      return NextResponse.json(
        { error: "Flash API key not found" },
        { status: 500 }
      );
    }

    const system_instruction = process.env.SYSTEM_INSTRUCTION;
    const { prompt, uuid } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let chat;
    if (uuid) {
      chat = await ChatHistory.findOne({ uuid, userId });
    }

    if (!chat) {
      chat = await ChatHistory.create({
        uuid: uuid || uuidv4(),
        userId,
        messages: [],
      });
    }

    chat.messages.push(`User: ${prompt}`);
    if (chat.messages.length > 10) {
      chat.messages = chat.messages.slice(-10);
    }

    const context = chat.messages.join("\n");

    const genAI = new GoogleGenerativeAI(flashApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: system_instruction,
    });

    const result = await model.generateContent(context);
    const aiResponse = await result.response.text();

    chat.messages.push(`AI: ${aiResponse}`);
    await chat.save();

    return NextResponse.json({ response: aiResponse, uuid: chat.uuid });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
