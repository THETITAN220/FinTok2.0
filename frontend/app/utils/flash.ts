import {translate} from "./translate"
import { tts } from "./tts";


interface FlashData {
  transcript: string;
}

export async function flash(data: FlashData, language_code: string) {
  console.log("Requesting AI response for transcript:", data.transcript);
  const aiResponse = await fetch("api/flash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: data.transcript,
      language: language_code, // Pass language to AI if needed
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("AI Response API Error:", errorText);
    throw new Error(`Failed to generate AI response: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const translated_text = await translate(aiData.response, language_code);
  console.log("AI Response:", aiData);

  if (!aiData.response) {
    throw new Error("No AI response received");
  }

  const audioUrl = await tts(translated_text, language_code);
  return { aiData, audioUrl };
}
