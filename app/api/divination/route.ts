import { NextRequest } from "next/server";
import OpenAI from "openai";
import { validateSessionToken } from "@/utils/2fa";
import gua from "@/data/gua.json";

export async function POST(req: NextRequest) {
  const { origin, variation, language, token } = await req.json();
  const is2faEnabled = process.env.NEXT_PUBLIC_USE_TWOFA === "true";
  if (is2faEnabled) {
    const authed = await validateSessionToken(token || "");
    if (!authed) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  const originResult = gua.gua.find((g) => g.binary === origin)?.name;
  const variationResult = gua.gua.find((g) => g.binary === variation)?.name;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: 20000,
  });

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_NAME ?? "chatgpt-4o-latest",
    temperature: 1.1,
    messages: [
      {
        role: "system",
        content: `你是一个周易占卜师。用户会告诉你一次占卜中的本卦和变卦，请分别输出本卦、变卦解释及总结，使用${language}语言。请严格输出 JSON：{"origin":"<本卦解析>","variation":"<变卦解析>","summary":"<总结>"}`,
      },
      { role: "user", content: `本卦为${originResult}，变卦为${variationResult}` },
    ],
    response_format: { type: "json_object" },
  });

  let payload = {
    origin: "服务器繁忙，请稍后再试",
    variation: "服务器繁忙，请稍后再试",
    summary: "服务器繁忙，请稍后再试",
  };
  try {
    const raw = response.choices[0].message.content;
    if (typeof raw === 'string') {
      payload = JSON.parse(raw);
    }
  } catch (e) {
    console.error("AI JSON parse error", e);
  }

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
