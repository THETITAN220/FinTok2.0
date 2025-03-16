import { NextRequest, NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const IC_enum = ["loanApplication", "loanEligibility", "financialGuidance", "generalQuery"];

async function intentClassifier(transcript: string, apiKey: string): Promise<string> {
  try {
    const client = new Mistral({ apiKey });
    const chatResponse = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: "You are an AI that classifies text into predefined categories. The predefined categories are: loanapplication,loanEligibility,financialGuidance. Classify it as one of these based on the user query. Look at the keywords used and make a judgement if they want to get some financial tip  or loan application guidance or loan eligibility criteria. If the kyewords dont show the intent, try to predict based on the words used." },
        { role: "user", content: `Classify the following statement into one of these categories: ${IC_enum.join(", ")}.
          \nStatement: "${transcript}"\n\nReturn only the category name.` },
      ],
      temperature: 0.2,
    });

    if (!chatResponse || !chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error("Mistral AI response is empty");
    }

    const content = typeof chatResponse.choices[0].message?.content === "string"
      ? chatResponse.choices[0].message.content.trim().toLowerCase()
      : undefined;
    return content && IC_enum.includes(content) ? content : "generalQuery";
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