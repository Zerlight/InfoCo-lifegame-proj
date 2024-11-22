"use client";

import React, { useState, useEffect } from "react";
import GameBoard from "@/app/components/game-board";
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
  Play,
  Grid2x2Check,
  Grid2x2X,
  Zap,
  Rabbit,
  Snail,
} from "lucide-react";
import TButton from "@/app/components/transition-button";
import useMeasure from "react-use-measure";
import LoadingSpinner from "./components/loading-spinner";

const AppPage = () => {
  const [running, setRunning] = useState(false);
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
