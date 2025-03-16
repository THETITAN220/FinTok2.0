// import {tts} from "./tts";

export async function translate(
  translate_text: string,
  translate_lang: string
) {
  console.log(`Translating AI response to ${translate_lang}...`);
  const translationResponse = await fetch("api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: translate_text,
      target_language_code: translate_lang,
    }),
  });

  if (!translationResponse.ok) {
    console.error("Translation API Error:", await translationResponse.text());
    throw new Error("Failed to translate AI response");
  }

  const translationData = await translationResponse.json();
  return translationData.translated_text;
  // const finalText = translationData.translated_text;
  // const finalLanguage = translate_lang;
  // await tts(finalText, finalLanguage);

  // console.log("Translation result:", finalText);
  // console.log("Final Language", finalLanguage);
}
