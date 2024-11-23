"use server";

import gua from "@/app/data/gua.json";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

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

export const getOpenAIResponse = async (origin: string, variation: string) => {
  const originResult = gua.gua.find((element) => element.binary === origin)?.name;
  const variationResult = gua.gua.find(
    (element) => element.binary === variation
  )?.name;

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
  });

  const Results = z.object({
    origin: z.string(),
    variation: z.string(),
    summary: z.string(),
  });

  const response = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini-2024-07-18",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "你是一个周易占卜师。用户会告诉你一次占卜中的本卦和变卦，请你对本卦和变卦各自做出解释，然后再给出一个总结性的占卜结果。",
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
    response_format: zodResponseFormat(Results, "explaination"),
  });

  const explaination = response.choices[0].message.parsed;

  return {
    origin: explaination?.origin,
    variation: explaination?.variation,
    summary: explaination?.summary,
  }

  // mock data
  // return {
  //   origin: "乾",
  //   variation: "坤",
  //   summary: "乾坤交合，大吉大利",
  // }
};
