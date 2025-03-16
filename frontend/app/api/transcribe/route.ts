import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const IC_enum = ["loanApplication", "loanEligibility", "financialGuidance", "generalQuery"];

async function intentClassifier(transcript: string, apiKey: string): Promise<string> {
  try {
    const client = new Mistral({ apiKey });

    // Explicit and structured prompt
    const chatResponse = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: `You are an AI designed to classify text into predefined categories.
        
        **Categories:**
        - loanApplication → If the user is asking about applying for a loan.
        - loanEligibility → If the user is inquiring about whether they qualify for a loan.
        - financialGuidance → If the user seeks financial advice (e.g., managing expenses, investments).
        - generalQuery → If the query does not match the above.

        **Instructions:** 
        - Analyze the input and map it to one of the categories.
        - Only return the exact category name.
        - If unsure, return "generalQuery".` },
        { role: "user", content: `Classify the following statement: "${transcript}". 
        Respond with only one of the following categories: ${IC_enum.join(", ")}` },
      ],
      temperature: 0.1, // Lower temperature to make responses more deterministic
    });

    if (!chatResponse?.choices?.length) throw new Error("Mistral AI response is empty");

    let content = chatResponse.choices[0]?.message?.content;
    if (typeof content === "string") {
      content = content.trim();
    } else {
      content = ""; // Handle non-string content appropriately
    }
    
    // Ensure the response is an exact match from IC_enum
    if (content && IC_enum.includes(content)) {
      return content;
    }

    // If AI response is unreliable, apply simple keyword-based matching
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes("loan") && lowerTranscript.includes("apply")) return "loanApplication";
    if (lowerTranscript.includes("loan") && lowerTranscript.includes("eligible")) return "loanEligibility";
    if (lowerTranscript.includes("finance") || lowerTranscript.includes("money") || lowerTranscript.includes("investment")) return "financialGuidance";

    return "generalQuery"; // Default fallback
  } catch (error) {
    console.error("Intent Classification Error:", error);
    return "generalQuery";
  }
}

export async function POST(req: NextRequest) {
  const sarvamapiKey = process.env.SARVAM_API_KEY;
  const mistralApiKey = process.env.MISTRAL_API_KEY;

  if (!sarvamapiKey || !mistralApiKey) {
    return NextResponse.json({ error: "API keys not found" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("file");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json({ error: "Invalid audio file" }, { status: 400 });
    }

    const sarvamFormData = new FormData();
    sarvamFormData.append("model", "saaras:v2");
    sarvamFormData.append("language_code", "unknown");
    sarvamFormData.append("with_timestamps", "false");
    sarvamFormData.append("with_diarization", "false");
    sarvamFormData.append("num_speakers", "1");
    sarvamFormData.append("file", audioFile);

    const response = await fetch("https://api.sarvam.ai/speech-to-text-translate", {
      method: "POST",
      headers: { "api-subscription-key": sarvamapiKey },
      body: sarvamFormData,
    });

    if (!response.ok) {
      throw new Error("Sarvam AI transcription failed");
    }

    const data = await response.json();
    const transcript = data.transcript || "No transcript available";
    const languageCode = data.language_code || "unknown";

    const intent = await intentClassifier(transcript, mistralApiKey);

    return NextResponse.json({ transcript, languageCode, intent, rawResponse: data });
  } catch (error) {
    console.error("Transcription Error:", error);
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 });
  }
}