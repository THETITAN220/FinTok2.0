import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const conversationHistory: string[] = []; // Store conversation context

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

    const genAI = new GoogleGenerativeAI(flashApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: system_instruction,
    });

    // Add user message to history
    conversationHistory.push(`User: ${prompt}`);

    // Keep only the last 10 messages
    if (conversationHistory.length > 10) {
      conversationHistory.shift();
    }

    // Format conversation history
    const context = conversationHistory.join("\n");

    // Generate AI response using full context
    const result = await model.generateContent(context);
    const aiResponse = await result.response.text();

    // Add AI response to history
    conversationHistory.push(`AI: ${aiResponse}`);

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
