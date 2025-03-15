export async function tts(finalText: string, finalLanguage: string) {
  const ttsPayload = {
    text: finalText,
    language_code: finalLanguage,
    quality: "high",
    speaker: "meera",
    speech_sample_rate: 22050,
    model: "bulbul:v1",
  };

  console.log("Requesting TTS conversion with payload:", ttsPayload);

  const ttsResponse = await fetch("http://localhost:5000/tts", {
    method: "POST",
    body: JSON.stringify(ttsPayload),
    headers: { "Content-Type": "application/json" },
  });

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text();
    console.error("TTS API Error:", errorText);
    throw new Error(
      `TTS API Error: ${ttsResponse.status} ${ttsResponse.statusText}`
    );
  }

  console.log(
    "TTS Response headers:",
    Object.fromEntries(ttsResponse.headers.entries())
  );

  const ttsData = await ttsResponse.blob();
  console.log(
    `TTS Audio blob received: ${ttsData.size} bytes, type: ${ttsData.type}`
  );
  return URL.createObjectURL(ttsData);
}
