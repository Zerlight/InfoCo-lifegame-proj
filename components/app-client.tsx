"use client";

import React, { useState, useEffect, useRef } from "react";
import GameBoard, { GameBoardHandles } from "@/components/game-board";
import {
  AvailableLocale,
  Dictionary,
  getDictionary,
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
import { getGuaInfo } from "@/utils/gua-intepreter";
import { useSpring, animated } from "@react-spring/web";
import GuaCard from "@/components/gua-card";
import AiCard from "@/components/ai-card";
import clsx from "clsx";

interface AppClientProps {
  initialDict: Dictionary;
  initialLang: AvailableLocale;
}

const AppClient: React.FC<AppClientProps> = ({ initialDict, initialLang }) => {
  const [running, setRunning] = useState(false);
  const [drawGridLines, setDrawGridLines] = useState(true);
  const [clear, setClear] = useState(false);
  const [langAct, setLangAct] = useState(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [dict, setDict] = useState<Dictionary>(initialDict);
  const [speed, setSpeed] = useState(2);
  const [grid, setGrid] = useState<boolean[][]>([[]]);
  const [lang, setLang] = useState<AvailableLocale>(initialLang);
  const [showDivine, setShowDivine] = useState<boolean | null>(false);
  const [boardRef, boardMeasure] = useMeasure();
  const [actionBarRef, actionBarMeasure] = useMeasure();
  const [boardDimensions, setBoardDimensions] = useState({ row: 0, col: 0 });
  const lastStableBoardDimsRef = useRef<{row:number;col:number}>({row:0,col:0});
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
  // Caches to avoid re-fetching AI explanation for identical pattern & language
  const aiCacheRef = useRef<Record<string, { origin: string; variation: string; summary: string }>>({});
  const guaCacheRef = useRef<Record<string, { originResult: any; variationResult: any }>>({});
  // Equal-height card system
  const cardWrapperRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const [cardsHeight, setCardsHeight] = useState<number | null>(null);

  // Animations
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

  // Language switching (client-side fetch for new dicts)
  useEffect(() => {
    if (lang === initialLang && dict) return; // initial already provided
    getDictionary(lang).then(setDict);
  }, [lang]);

  // Helper to (re)calculate grid size from current measurements
  const recalcBoardSize = React.useCallback(() => {
    if (boardMeasure.width === 0 || boardMeasure.height === 0) return;
    const cellSize = 10;
    const availableHeight = Math.max(0, boardMeasure.height - actionBarMeasure.height);
    const targetCols = Math.max(1, Math.floor(boardMeasure.width / cellSize));
    const targetRows = Math.max(1, Math.floor(availableHeight / cellSize));
    if (targetCols === boardDimensions.col && targetRows === boardDimensions.row) return;
    setGrid(prev => Array.from({ length: targetRows }, (_, r) =>
      Array.from({ length: targetCols }, (_, c) => (r < prev.length && c < (prev[0]?.length || 0) ? prev[r][c] : false))
    ));
    setBoardDimensions({ row: targetRows, col: targetCols });
    lastStableBoardDimsRef.current = { row: targetRows, col: targetCols };
  }, [boardMeasure.width, boardMeasure.height, actionBarMeasure.height, boardDimensions.col, boardDimensions.row]);

  // Resize logic disabled while divination cards are shown to avoid shrinking during overlay
  useEffect(() => {
    if (showDivine) return; // pause recalculation while overlay active
    recalcBoardSize();
  }, [recalcBoardSize, showDivine]);

  // On exiting divination view (showDivine becomes false), force a recalculation once
  useEffect(() => {
    if (showDivine === false) {
      // slight delay to allow layout to settle after animation
      const t = setTimeout(() => recalcBoardSize(), 50);
      return () => clearTimeout(t);
    }
  }, [showDivine, recalcBoardSize]);

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
    const cacheKey = `${origin}-${variation}-${lang}`;

    // If cached, reuse immediately (skip network fetch)
    const cachedAI = aiCacheRef.current[cacheKey];
    const cachedGua = guaCacheRef.current[cacheKey];
    if (cachedAI && cachedGua) {
      setGuaResults({
        originResult: cachedGua.originResult,
        variationResult: cachedGua.variationResult,
      });
      setOpenaiResponse({
        origin: cachedAI.origin,
        variation: cachedAI.variation,
        summary: cachedAI.summary,
      });
      setShowDivine(true);
      return; // done
    }
    getGuaInfo(origin, variation).then((guaInfo) => {
      setGuaResults(guaInfo);
      if (!showDivine) setShowDivine(true);
      // store deterministic gua results in cache (even if AI not yet returned)
      guaCacheRef.current[cacheKey] = {
        originResult: guaInfo.originResult,
        variationResult: guaInfo.variationResult,
      } as any;
    });
    // Call API route (non-streaming)
    fetch("/api/divination", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, variation, language: lang, token }),
    })
      .then((r) => r.json())
      .then((data) => {
        setOpenaiResponse(data);
        if (!showDivine) setShowDivine(true);
        if (data && data.origin && data.variation && data.summary) {
          aiCacheRef.current[cacheKey] = {
            origin: data.origin,
            variation: data.variation,
            summary: data.summary,
          };
        }
      })
      .catch(() => {
        alert("AI request failed");
      });
  };

  // Compute equal height after data ready
  useEffect(() => {
    if (!showDivine) return;
    const nodes = cardRefs.current.filter(Boolean);
    if (nodes.length === 0) return;
    // Reset height to natural for measurement
    nodes.forEach(n => n && (n.style.height = 'auto'));
    const naturalHeights = nodes.map(n => n.scrollHeight);
    const maxNatural = Math.max(...naturalHeights);
    const actionH = actionBarMeasure.height || 0;
    const viewport = window.innerHeight;
    const margin = 32; // breathing space
    const available = Math.max(180, viewport - actionH - margin);
    const target = Math.min(maxNatural, available);
    setCardsHeight(target);
  }, [showDivine, guaResults, openaiResponse, dict, actionBarMeasure.height]);

  useEffect(() => {
    if (!showDivine) return;
    const onResize = () => {
      const nodes = cardRefs.current.filter(Boolean);
      if (nodes.length === 0) return;
      nodes.forEach(n => (n.style.height = 'auto'));
      const maxNatural = Math.max(...nodes.map(n => n.scrollHeight));
      const actionH = actionBarMeasure.height || 0;
      const available = Math.max(180, window.innerHeight - actionH - 32);
      setCardsHeight(Math.min(maxNatural, available));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [showDivine, actionBarMeasure.height]);

  return (
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
              onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 20 : 1)}
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
              speed={speed}
            />
          )}
        </div>
      </animated.div>
      <animated.div
        className={clsx(
          "fixed bottom-0 left-0 right-0 bg-background border-t dark:border-t-neutral-800 border-t-neutral-200",
          showDivine === true
            ? "z-0 pointer-events-none select-none"
            : "z-50 pointer-events-auto"
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
          showDivine === false
            ? "hidden pointer-events-none"
            : "z-40 pointer-events-auto"
        )}
        style={divineSpring}
      >
        <div className="flex flex-col justify-end gap-1 flex-1 h-full w-full">
          {guaResults ? (
            <div
              ref={cardWrapperRef}
              className="flex justify-evenly items-end flex-1 bg-background overflow-x-auto overflow-y-visible p-4 z-20 gap-2"
            >
              <div
                ref={(el) => { if (el) cardRefs.current[0] = el; }}
                style={cardsHeight ? { height: cardsHeight } : undefined}
                className="flex flex-col flex-1 min-w-72 max-w-96"
              >
                <GuaCard
                  gua={guaResults.originResult as any}
                  className="text-slate-200 shadow-slate-300 bg-slate-500 flex-1"
                  aiResponse={openaiResponse?.origin as string}
                  lang={dict}
                />
              </div>
              <div
                ref={(el) => { if (el) cardRefs.current[1] = el; }}
                style={cardsHeight ? { height: cardsHeight } : undefined}
                className="flex flex-col flex-1 min-w-72 max-w-96"
              >
                <AiCard
                  response={openaiResponse ? { origin: guaResults.originResult?.name as string, variation: guaResults.variationResult?.name as string, summary: openaiResponse?.summary as string } : undefined}
                  className="text-slate-200 shadow-slate-300 bg-slate-500 flex-1"
                  lang={dict}
                />
              </div>
              <div
                ref={(el) => { if (el) cardRefs.current[2] = el; }}
                style={cardsHeight ? { height: cardsHeight } : undefined}
                className="flex flex-col flex-1 min-w-72 max-w-96"
              >
                <GuaCard
                  gua={guaResults.variationResult as any}
                  className="text-slate-200 shadow-slate-300 bg-slate-500 flex-1"
                  aiResponse={openaiResponse?.variation as string}
                  lang={dict}
                />
              </div>
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
  );
};

export default AppClient;
