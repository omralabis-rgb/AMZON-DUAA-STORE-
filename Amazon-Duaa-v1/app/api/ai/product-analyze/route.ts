import { NextResponse } from "next/server";
import { generateWithGemini, extractJson } from "@/lib/ai/gemini";

export const runtime = "nodejs";

const SYSTEM = `You are Amazon Duaa's product catalog AI. Analyze the uploaded product image and return ONLY valid JSON with these keys: name_ar, name_en, description_ar, category_suggestion, brand_suggestion, tags, seo_title_ar, seo_description_ar, price_suggestion, confidence. Never invent exact manufacturer claims. If brand or price cannot be inferred reliably, return null. tags must be an array of short strings and confidence must be a number from 0 to 1.`;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be 10 MB or smaller" }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer()).toString("base64");
    const result = await generateWithGemini(
      [
        { text: "Analyze this product image for an e-commerce catalog." },
        { inlineData: { mimeType: file.type, data } },
      ],
      { systemInstruction: SYSTEM },
    );

    return NextResponse.json({ result: extractJson(result.text) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI analysis failed" },
      { status: 500 },
    );
  }
}
