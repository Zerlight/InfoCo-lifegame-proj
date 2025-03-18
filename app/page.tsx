"use client";

import clsx from "clsx";
import React, { useState, useEffect, useRef } from "react";
import GameBoard, { GameBoardHandles } from "@/components/game-board";
import { getNextGeneration } from "@/utils/game-logic";
import {
  getDictionary,
  AvailableLocale,
  matchLocale,
  Dictionary,
} from "@/utils/dictionaries";
import Image from "next/image";
import {
  Languages,
  Pen,
  Eraser,
  Trash2,
  Play,
  Sparkles,
  Grid2x2Check,
  Grid2x2X,
  Zap,
  Rabbit,
  Snail,
  Undo2,
} from "lucide-react";
import TButton from "@/components/transition-button";
import useMeasure from "react-use-measure";
import LoadingSpinner from "@/components/loading-spinner";
import { getGuaInfo, getOpenAIResponse } from "@/utils/gua-intepreter";
import { useSpring, animated } from "@react-spring/web";
import GuaCard from "@/components/gua-card";
import AiCard from "@/components/ai-card";

const AppPage = () => {
  const [running, setRunning] = useState(false);
  const [drawGridLines, setDrawGridLines] = useState(true);
  const [clear, setClear] = useState(false);
  const [langAct, setLangAct] = useState(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [dict, setDict] = useState<Dictionary>();
  const [speed, setSpeed] = useState(2);
  const [grid, setGrid] = useState<boolean[][]>([[]]);
  const [lang, setLang] = useState<AvailableLocale>(
    matchLocale(navigator.language)
  );
  const [showDivine, setShowDivine] = useState<boolean | null>(false);
  const [boardRef, boardMeasure] = useMeasure();
  const [actionBarRef, actionBarMeasure] = useMeasure();
  const [boardDimensions, setBoardDimensions] = useState({
    row: 0,
    col: 0,
  });
  const [guaResults, setGuaResults] = useState<{
    originResult?: {
      name: string;
      binary: string;
      "gua-detail": string;
      "yao-detail": string[];
    };
    variationResult?: {
      name: string;
      binary: string;
      "gua-detail": string;
      "yao-detail": string[];
    };
  } | null>(null);
  const [openaiResponse, setOpenaiResponse] = useState<{
    origin?: string;
    variation?: string;
    summary?: string;
  } | null>(null);
  const gameBoardRef = useRef<GameBoardHandles>(null);
  const boardSpring = useSpring({
    opacity: !showDivine ? 1 : 0,
    transform: showDivine
      ? "scale(0.5) translateY(100%)"
      : "scale(1) translateY(0%)",
    config: { tension: 180, friction: 24 },
  });
  const actionSpring = useSpring({
    transform: showDivine ? "translateY(100%)" : "translateY(0%)",
    config: { tension: 180, friction: 24 },
  });
  const divineSpring = useSpring({
    opacity: showDivine ? 1 : 0,
    transform: showDivine
      ? "scale(1) translateY(0%)"
      : "scale(1.5) translateY(100%)",
    config: { tension: 180, friction: 24 },
    onRest: () => {
      if (showDivine === true) return;
      setShowDivine(false);
    },
  });

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
  }, [boardMeasure, actionBarMeasure, boardDimensions]);

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
  }, [grid, boardDimensions]);

  const generateDivine = async () => {
    const is2faEnabled = process.env.NEXT_PUBLIC_USE_TWOFA === "true";
    let token: string | null = null;
    if (is2faEnabled) {
      token = sessionStorage.getItem("InfoCo_2fa_token");
      if (!token) {
        alert("Please verify 2FA first.");
        window.location.reload();
        return;
      }
    }
    if (!gameBoardRef.current) return;
    setGuaResults(null);
    setOpenaiResponse(null);
    setShowDivine(false);
    const template: number[] = gameBoardRef.current.getDivinatoryTrigrams();
    const origin = template
      .map((num) => (num === 0 || num === 2 ? "0" : "1"))
      .join("");
    const variation = template
      .map((num) => (num === 0 || num === 3 ? "0" : "1"))
      .join("");
    getGuaInfo(origin, variation).then((guaInfo) => {
      setGuaResults(guaInfo);
      if (!showDivine) setShowDivine(true);
    });
    getOpenAIResponse(origin, variation, lang, token ?? "").then(
      (openaiResponse) => {
        if (!openaiResponse) {
          alert("Session expired. Please verify 2FA first.");
          window.location.reload();
          return;
        }
        setOpenaiResponse(openaiResponse);
        if (!showDivine) setShowDivine(true);
      }
    );
  };

  return dict ? (
    <div className="px-5 py-3 flex flex-col min-h-dvh">
      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center mt-1.5">
          <Image
            src="/logo.svg"
            alt="logo"
            width={100}
            height={25.59}
            className="dark:invert"
          />
          <div className="flex gap-1">
            <TButton onClick={() => setDrawGridLines(!drawGridLines)}>
              {drawGridLines ? <Grid2x2Check /> : <Grid2x2X />}
            </TButton>
            <TButton
              onClick={() => {
                setSpeed(speed === 1 ? 2 : speed === 2 ? 20 : 1);
              }}
              activated={speed === 20}
            >
              {speed === 1 ? <Snail /> : speed === 2 ? <Rabbit /> : <Zap />}
            </TButton>
            <TButton
              onClick={() => {
                setLang(lang === "en" ? "zh" : "en");
                setLangAct(true);
                setTimeout(() => setLangAct(false), 1000);
              }}
              activated={langAct}
            >
              <Languages />
              <span>{dict.language}</span>
            </TButton>
          </div>
        </div>
        <span className="text-2xl font-bold mt-3">{dict.title}</span>
        <span className="text-md">
          {showDivine ? dict.divineDescription : dict.description}
        </span>
      </div>
      <animated.div className="flex-1" ref={boardRef} style={boardSpring}>
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
      </animated.div>
      <animated.div
        className={clsx(
          "fixed bottom-0 left-0 right-0 bg-background border-t dark:border-t-neutral-800 border-t-neutral-200",
          showDivine ? "z-0 touch-none select-none" : "z-10"
        )}
        style={actionSpring}
      >
        <div className="flex justify-evenly py-4 px-5 gap-1" ref={actionBarRef}>
          <TButton
            activated={running}
            onClick={() => setRunning(!running)}
            disabled={showDivine === true}
          >
            <Play />
            <span>{dict.run}</span>
          </TButton>
          <TButton
            activated={mode === "draw" && !running}
            disabled={running || showDivine === true}
            onClick={() => setMode("draw")}
          >
            <Pen />
            <span>{dict.draw}</span>
          </TButton>
          <TButton
            activated={mode === "erase" && !running}
            disabled={running || showDivine === true}
            onClick={() => setMode("erase")}
          >
            <Eraser />
            <span>{dict.erase}</span>
          </TButton>
          <TButton
            disabled={running || showDivine === true}
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
            <span>{dict.clear}</span>
          </TButton>
          <TButton
            onClick={generateDivine}
            activated={showDivine === true}
            disabled={running}
          >
            <Sparkles />
            <span>{dict.divine}</span>
          </TButton>
        </div>
      </animated.div>
      <animated.div
        className={clsx(
          "fixed bottom-0 left-0 right-0 h-screen flex items-end w-screen",
          showDivine === false ? "z-0 touch-none select-none hidden" : "z-10"
        )}
        style={divineSpring}
      >
        <div className="flex flex-col justify-end gap-1 flex-1 h-full w-full">
          {guaResults ? (
            <div className="flex justify-evenly items-end flex-1 bg-background overflow-x-scroll overflow-y-visible px-4 py-8 z-20">
              <GuaCard
                gua={
                  guaResults.originResult as {
                    name: string;
                    binary: string;
                    "gua-detail": string;
                    "yao-detail": string[];
                  }
                }
                className={`text-slate-200 shadow-slate-300 bg-slate-500`}
                aiResponse={openaiResponse?.origin as string}
                lang={dict}
              />
              <AiCard
                response={
                  openaiResponse
                    ? {
                        origin: guaResults.originResult?.name as string,
                        variation: guaResults.variationResult?.name as string,
                        summary: openaiResponse?.summary as string,
                      }
                    : undefined
                }
                className={`text-slate-200 shadow-slate-300 bg-slate-500`}
                lang={dict}
              />
              <GuaCard
                gua={
                  guaResults.variationResult as {
                    name: string;
                    binary: string;
                    "gua-detail": string;
                    "yao-detail": string[];
                  }
                }
                className={`text-slate-200 shadow-slate-300 bg-slate-500`}
                aiResponse={openaiResponse?.variation as string}
                lang={dict}
              />
            </div>
          ) : (
            <LoadingSpinner size={48} />
          )}
          <div className="flex gap-2 self-center pb-2">
            {openaiResponse !== null && guaResults !== null ? (
              <TButton onClick={() => setShowDivine(null)}>
                <Undo2 />
              </TButton>
            ) : (
              <span className="text-xs py-3 text-slate-600 font-bold">
                {dict.loadingAI}
              </span>
            )}
          </div>
        </div>
      </animated.div>
    </div>
  ) : (
    <div className="flex flex-col justify-center items-center h-screen gap-10">
      <Image src="/logo.svg" alt="logo" width={300} height={76.77} />
      <LoadingSpinner size={48} />
    </div>
  );
};

export default AppPage;
