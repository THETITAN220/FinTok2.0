
import { flash } from "./flash";

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; audioUrl: string; intent?: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  
  try {
    const response = await fetch("api/transcribe", {
      method: "POST",
      body: formData,
    });
    
    if (!response.ok) throw new Error("Transcription failed");
    
    const data = await response.json();
    console.log(data);
    const language_code = data.languageCode || "en-IN";
    
    // Extract intent classification
    const intent = data.intent;
    
    console.log("Transcription:", data.transcript);
    console.log("Transcription language code:", language_code);
    console.log("Detected Intent:", intent);
    
    // Return intent with other data
    if (intent === "loanApplication") {
      return { text: data.transcript, audioUrl: "", intent: "loanApplication" };
    }
    
    if (intent === "generalQuery" || intent === "financialGuidance") {
      const airesponse = await flash({ transcript: data.transcript }, language_code);
      const audioUrl = airesponse.audioUrl || "";
      
      return { text: airesponse.aiData.transcript, audioUrl, intent };
    }
    
    // If intent does not match, return transcription without AI processing
    return { text: data.transcript, audioUrl: "", intent };
  } catch (error) {
    console.error("Error in transcription:", error);
    return { text: "Transcription failed", audioUrl: "", intent: "generalQuery" };
  }
}