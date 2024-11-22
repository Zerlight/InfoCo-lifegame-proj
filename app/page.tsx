"use client";

import React, { useState, useEffect, useRef} from "react";
import GameBoard, {GameBoardHandles} from "@/app/components/game-board";
import { getNextGeneration } from "@/app/utils/game-logic";
import {
  getDictionary,
  AvailableLocales,
  matchLocale,
  Dictionary,
} from "@/app/utils/dictionaries";
import Image from "next/image";
import {
  Languages,
  Pen,
  Eraser,
  Trash2,
  Play, Sparkles,
  Grid2x2Check,
  Grid2x2X,
  Zap,
  Rabbit,
  Snail,
} from "lucide-react";
import TButton from "@/app/components/transition-button";
import useMeasure from "react-use-measure";
import OpenAI from "openai";
import {z} from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import LoadingSpinner from "./components/loading-spinner";

const AppPage = () => {
  const [running, setRunning] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [drawGridLines, setDrawGridLines] = useState(true);
  const [clear, setClear] = useState(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [dict, setDict] = useState<Dictionary>();
  const [speed, setSpeed] = useState(2);
  const [grid, setGrid] = useState<boolean[][]>([[]]);
  const [lang, setLang] = useState<AvailableLocales>(
    matchLocale(navigator.language)
  );
  const [boardRef, boardMeasure] = useMeasure();
  const [actionBarRef, actionBarMeasure] = useMeasure();
  const [boardDimensions, setBoardDimensions] = useState({
    row: 0,
    col: 0,
  });
  const gameBoardRef = useRef<GameBoardHandles>(null);
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
    dangerouslyAllowBrowser: true
  });

  const Results = z.object({
    origin: z.string(),
    variation: z.string(),
    summary: z.string()
  })

  useEffect(() => {
    getDictionary(lang).then((result) => setDict(result));
  }, [lang]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setGrid((prev) => getNextGeneration(prev));
    }, 200 / speed);
    return () => clearInterval(interval);
  }, [running, speed]);

  useEffect(() => {
    const _cols = Math.floor(boardMeasure.width / 10);
    const _rows = Math.floor(
      (boardMeasure.height - actionBarMeasure.height) / 10
    );
    if (_rows > boardDimensions.row || _cols > boardDimensions.col) {
      const deltaRow = Math.max(_rows - boardDimensions.row, 0);
      const deltaCol = Math.max(_cols - boardDimensions.col, 0);
      setGrid((prevGrid) => {
        const newGrid = [
          ...prevGrid,
          ...Array(deltaRow).fill(Array(_cols).fill(false)),
        ];
        for (let i = 0; i < prevGrid.length; i++) {
          newGrid[i] = [...newGrid[i], ...Array(deltaCol).fill(false)];
        }
        return newGrid;
      });
    }
  }, [boardMeasure, actionBarMeasure]);

  useEffect(() => {
    if (
      grid[0].length === boardDimensions.col &&
      grid.length === boardDimensions.row
    )
      return;
    if (grid[0].length === 0) return;
    setBoardDimensions({
      row: grid.length,
      col: grid[0].length,
    });
  }, [grid]);

  return dict ? (
    <div className="px-5 py-3 flex flex-col min-h-screen">
      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center mt-1.5">
          <Image
            src="/logo.svg"
            alt="logo"
            width={100}
            height={25.59}
            className="dark:invert"
          />
          <button onClick={() => setLang(lang === "en" ? "zh" : "en")}>
            <Languages />
          </button>
        </div>
        <span className="text-2xl font-bold mt-3">{dict.title}</span>
        <span className="text-md">{dict.description}</span>
      </div>
      <div className="flex-1" ref={boardRef}>
        <div className="mx-auto">
          {boardDimensions.row !== 0 && boardDimensions.col !== 0 && (
            <GameBoard
              ref={gameBoardRef}
              grid={grid}
              setGrid={setGrid}
              running={running}
              mode={mode}
              rows={boardDimensions.row}
              cols={boardDimensions.col}
              cellSize={10}
              drawGridLines={drawGridLines}
            />
          )}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t dark:border-t-neutral-800 border-t-neutral-200">
        <div
          className="flex justify-evenly py-4 px-5 gap-1"
          ref={actionBarRef}
        >
          <TButton activated={running} onClick={() => setRunning(!running)}>
            <Play />
            <span>{dict.run}</span>
          </TButton>
          <TButton
            activated={mode === "draw" && !running}
            disabled={running}
            hidden={running && actionBarMeasure.width < 450}
            onClick={() => setMode("draw")}
          >
            <Pen />
            <span>{dict.draw}</span>
          </TButton>
          <TButton
            activated={mode === "erase" && !running}
            disabled={running}
            hidden={running && actionBarMeasure.width < 450}
            onClick={() => setMode("erase")}
          >
            <Eraser />
            <span>{dict.erase}</span>
          </TButton>
          <TButton
            disabled={running}
            hidden={running && actionBarMeasure.width < 450}
            activated={clear}
            onClick={() => {
              if (clear) return;
              setGrid(
                Array(boardDimensions.row).fill(
                  Array(boardDimensions.col).fill(false)
                )
              );
              setClear(true);
              setTimeout(() => setClear(false), 1000);
            }}
          >
            <Trash2 />
          </TButton>
          <TButton
            onClick={() => {
              setSpeed(speed === 1 ? 2 : speed === 2 ? 20 : 1);
            }}
            activated={speed === 20}
            hidden={!running && actionBarMeasure.width < 450}
          >
            {speed === 1 ? <Snail /> : speed === 2 ? <Rabbit /> : <Zap />}
          </TButton>
          <TButton
            activated={drawGridLines}
            onClick={() => setDrawGridLines(!drawGridLines)}
          >
            {drawGridLines ? <Grid2x2Check /> : <Grid2x2X />}
          </TButton>
          <TButton
            onClick={async ()=>{
              if(gameBoardRef.current){
                const template: number[] = gameBoardRef.current.getDivinatoryTrigrams();
                const origin = template.map(num => 
                  num === 0 || num === 2 ? '0' : '1'
                ).join('');
                
                const variation = template.map(num => 
                  num === 0 || num === 3 ? '0' : '1'
                ).join('');
                
                const hexagramMap: Record<string, string> = {
                  "111111": "乾",   "111110": "夬",   "111101": "大有", "111100": "大壮",
                  "111011": "小畜", "111010": "需",   "111001": "大畜", "111000": "泰",
                  "110111": "履",   "110110": "泽",   "110101": "睽",   "110100": "归妹",
                  "110011": "中孚", "110010": "节",   "110001": "损",   "110000": "临",
                  "101111": "同人", "101110": "革",   "101101": "火",   "101100": "丰",
                  "101011": "家人", "101010": "既济", "101001": "贲",   "101000": "明夷",
                  "100111": "无妄", "100110": "随",   "100101": "噬嗑", "100100": "雷",
                  "100011": "益",   "100010": "屯",   "100001": "头",   "100000": "复",
                  "011111": "姤",   "011110": "大过", "011101": "鼎",   "011100": "恒",
                  "011011": "风",   "011010": "井",   "011001": "蛊",   "011000": "升",
                  "010111": "讼",   "010110": "困",   "010101": "未济", "010100": "解",
                  "010011": "涣",   "010010": "水",   "010001": "蒙",   "010000": "师",
                  "001111": "遯",   "001110": "咸",   "001101": "旅",   "001100": "小过",
                  "001011": "渐",   "001010": "蹇",   "001001": "山",   "001000": "谦",
                  "000111": "否",   "000110": "萃",   "000101": "晋",   "000100": "豫",
                  "000011": "观",   "000010": "比",   "000001": "剥",   "000000": "地"
                };
                const originHexagram = hexagramMap[origin];
                const variationHexagram = hexagramMap[variation];
                const response = await openai.beta.chat.completions.parse({
                  model: "gpt-4o-mini-2024-07-18",
                  messages: [
                    {
                      role: "system",
                      content:[
                        {
                          type: "text",
                          text: "你是一个周易占卜师。用户会告诉你一次占卜中的本卦和变卦，请你对本卦和变卦各自做出解释，然后再给出一个总结性的占卜结果。"
                        }
                      ]
                    },
                    {
                      role: "user",
                      content: [
                        { 
                          type: "text", 
                          text: `本卦为${originHexagram}，变卦为${variationHexagram}`
                        }
                      ],
                    },
                  ],
                  response_format: zodResponseFormat(Results, "explaination")
                });
                const explaination = response.choices[0].message.parsed
                const paraHtml = `<p>${explaination?.origin}</p>\n<p>${explaination?.variation}</p>\n<p>${explaination?.summary}</p>\n<p>[DEBUG] 本卦为${originHexagram}，变卦为${variationHexagram}</p>`
                 const newWindow = window.open("", "_blank", "width=600,height=400");
                 if(newWindow){
                   newWindow.document.write(paraHtml);
                   newWindow.document.title = "Preview";
                 }
              }
            }
            }
          >
            <Sparkles />
            <span>{dict.divine}</span>
          </TButton>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col justify-center items-center h-screen gap-10">
      <Image
        src="/logo.svg"
        alt="logo"
        width={300}
        height={76.77}
      />
      <LoadingSpinner size={48} />
    </div>
  );
};

export default AppPage;
