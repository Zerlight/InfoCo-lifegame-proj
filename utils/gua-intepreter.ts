"use server";

import gua from "@/data/gua.json";
import OpenAI from "openai";
import { AvailableLocale } from "@/utils/dictionaries";
import { validateSessionToken } from "@/utils/2fa";

export const getGuaInfo = async (origin: string, variation: string) => {
  const originResult = gua.gua.find((element) => element.binary === origin);
  const variationResult = gua.gua.find(
    (element) => element.binary === variation
  );
  return {
    originResult,
    variationResult,
  };
};

export const getOpenAIResponse = async (
  origin: string,
  variation: string,
  language: AvailableLocale,
  token: string,
  requestId: string
) => {
  const is2faEnabled = process.env.NEXT_PUBLIC_USE_TWOFA === "true";
  if (is2faEnabled) {
    const isAuthed = await validateSessionToken(token);
    if (!isAuthed) {
      return null;
    }
  }
  // cancellation removed (non-streaming mode)
  const originResult = gua.gua.find(
    (element) => element.binary === origin
  )?.name;
  const variationResult = gua.gua.find(
    (element) => element.binary === variation
  )?.name;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
    timeout: 20000,
  });

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL_NAME ?? "chatgpt-4o-latest",
    temperature: 1.3,
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: `你是一个周易占卜师。用户会告诉你一次占卜中的本卦和变卦，请你对本卦和变卦各自做出解释，然后再给出一个总结性的占卜结果。请将结果输出为JSON，输出的内容语言为：${language}，输出格式：{origin: '<本卦解释>', variation: '<变卦解释>', summary: '<占卜结果总结>'}`,
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `本卦为${originResult}，变卦为${variationResult}`,
          },
        ],
      },
    ],
    response_format: {
      type: "json_object",
    },
  });

  let explaination: {
    origin: string;
    variation: string;
    summary: string;
  } = {
    origin: "服务器繁忙，请稍后再试",
    variation: "服务器繁忙，请稍后再试",
    summary: "服务器繁忙，请稍后再试",
  };

  try {
    const raw = response.choices[0].message.content;
    if (typeof raw === 'string') {
      explaination = JSON.parse(raw);
    }
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
  }

  // cancellation removed

  return {
    origin: explaination.origin,
    variation: explaination.variation,
    summary: explaination.summary,
  };

  // mock data
  // return {
  //   origin: "乾",
  //   variation: "坤",
  //   summary: "乾坤交合，大吉大利",
  // }
};
