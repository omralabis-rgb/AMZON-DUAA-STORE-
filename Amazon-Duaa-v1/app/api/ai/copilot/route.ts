import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithGemini } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "message is required" }, { status: 400 });
    if (message.length > 4000) return NextResponse.json({ error: "message is too long" }, { status: 400 });

    const [products, orders] = await Promise.all([
      supabase.from("products").select("id,name,price,stock_quantity,status").limit(100),
      supabase.from("orders").select("id,order_number,status,total_amount,created_at").order("created_at", { ascending: false }).limit(100),
    ]);

    const context = JSON.stringify({
      products: products.data || [],
      recent_orders: orders.data || [],
    });

    const result = await generateWithGemini(
      [{ text: message }],
      {
        systemInstruction: `You are the read-only AI Admin Copilot for Amazon Duaa. Answer in Arabic unless the admin asks otherwise. You may analyze the supplied store context, but you must not claim that you changed data or executed an action. Any mutation must be proposed for human approval. Store context follows: ${context}`,
      },
    );

    return NextResponse.json({ answer: result.text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Copilot request failed" },
      { status: 500 },
    );
  }
}
