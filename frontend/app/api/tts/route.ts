import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const sarvamApiKey = process.env.SARVAM_API_KEY;
  if (!sarvamApiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 500 });
  }

  try {
    const { text, language_code } = await req.json();

    if (!text || !language_code) {
      return NextResponse.json(
        { error: "Missing text or language_code" },
        { status: 400 }
      );
    }

    console.log(
      `Processing TTS request for text (${text.length} chars) in language: ${language_code}`
    );

    // Prepare payload for Sarvam AI TTS API
    const payload = {
      inputs: [text],
      target_language_code: language_code,
      // Add optional parameters for better audio quality (if supported by Sarvam)

      audio_format: "wav", // Request specific format if supported
      sample_rate: 24000, // Higher sample rate for better quality if supported
    };

    const headers = {
      "api-subscription-key": sarvamApiKey,
      "Content-Type": "application/json",
    };

    // Send request to Sarvam AI API
    console.log("Sending request to Sarvam API...");
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    // Log complete response information for debugging
    console.log(
      "Sarvam API Response Status:",
      response.status,
      response.statusText
    );
    console.log(
      "Sarvam API Response Headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam API Error Response:", errorText);
      throw new Error(
        `Sarvam AI API Error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Sarvam API Response Structure:", Object.keys(data));

    if (!data.audios || data.audios.length === 0) {
      throw new Error("No audio data received from API");
    }

    // Get the format information if provided by the API
    const audioFormat = data.audio_format || "wav";
    const contentType =
      audioFormat === "mp3"
        ? "audio/mpeg"
        : audioFormat === "wav"
        ? "audio/wav"
        : "audio/mpeg"; // Default fallback

    // Decode base64 audio
    const audioBuffer = Buffer.from(data.audios[0], "base64");
    console.log(`Decoded audio buffer of size: ${audioBuffer.length} bytes`);

    // Return audio with correct headers for playback
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="output.${audioFormat}"`,
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-cache", // Prevent caching issues
      },
    });
  } catch (error) {
    console.error("Error in TTS conversion:", error);
    return NextResponse.json(
      {
        error: "Failed to generate TTS",
      },
      { status: 500 }
    );
  }
}
