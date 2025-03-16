import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { input, target_language_code } = await req.json();

    if (!input || !target_language_code) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const api_key = process.env.SARVAM_API_KEY; // Store API key in .env.local

    const url = "https://api.sarvam.ai/translate";
    const headers = {
      "api-subscription-key": api_key!,
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      input: input,
      source_language_code: "en-IN",
      target_language_code: target_language_code,
      speaker_gender: "Male",
      mode: "formal",
      model: "mayura:v1",
      enable_preprocessing: false,
      output_script: "fully-native",
      numerals_format: "international",
    });

    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const responseData = await response.json();
    console.log("Translated", responseData.translated_text);
    return NextResponse.json({ translated_text: responseData.translated_text });

  } catch (error) {
    console.log("Error in translation:", error);
    return NextResponse.json({ error:"sarvam error"}, { status: 500 });

  }
}
