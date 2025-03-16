// import { flash } from "./flash";

// export async function transcribeAudio(audioBlob: Blob): Promise<string> {
//   const formData = new FormData();
//   formData.append("file", audioBlob, "audio.wav");

//   try {
//     const response = await fetch("/api/transcribe", {
//       method: "POST",
//       body: formData,
//     });
    
//     if (!response.ok) {
//       throw new Error("Transcription failed");
//     }

//     const data = await response.json();
//     const language_code = data.languageCode || "en-IN";

//     console.log("Transcription:", data.transcript);
//     console.log("Transcription language code:", language_code);

//     // Ensure flash is awaited to handle async properly
//     await flash({ transcript: data.transcript }, language_code);

//     return data.transcript; // Ensure function returns a string
//   } catch (error) {
//     console.error("Error in transcription:", error);
//     return "Transcription failed"; // Ensure function always returns a string
//   }
// }

// 

import { flash } from "./flash";  

export async function transcribeAudio(audioBlob: Blob): Promise<{ text: string; audioUrl: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");

  try {
    const response = await fetch("api/transcribe", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Transcription failed");

    const data = await response.json();
    console.log(data)
    const language_code = data.languageCode || "en-IN";

    // Define valid intents
    const IC_enum = ["loanapplication", "loanEligibility", "financialGuidance"];
    
    // Extract intent classification (assuming it's inside data)
    const IC = data.intent; 

    console.log("Transcription:", data.transcript);
    console.log("Transcription language code:", language_code);
    console.log("Detected Intent:", IC);

    if (IC === "generalQuery" || IC === "financialGuidance") {
      const airesponse = await flash({ transcript: data.transcript }, language_code);
      const audioUrl = airesponse.audioUrl || ""; // Ensure audioUrl is defined

      return { text: airesponse.aiData.transcript, audioUrl }; // Ensure flash returns audioUrl
    }

    // If intent does not match, return transcription without AI processing
    return { text: data.transcript, audioUrl: "" };

  } catch (error) {
    console.error("Error in transcription:", error);
    return { text: "Transcription failed", audioUrl: "" };
  }
}
