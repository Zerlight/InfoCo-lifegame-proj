"use client";

import React, { useState, useEffect, use } from "react";
import GameBoard from "@/app/components/game-board";
import { getNextGeneration } from "@/app/utils/game-logic";
import {
  getDictionary,
  availableLocales,
  matchLocale,
} from "@/app/utils/dictionaries";
import Image from "next/image";

const AppPage = () => {
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"draw" | "erase">("draw");
  const [dict, setDict] = useState<any>({});
  const [grid, setGrid] = useState<boolean[][]>(
    Array.from({ length: 50 }, () => Array(50).fill(false))
  );
  const [lang, setLang] = useState<availableLocales>(
    matchLocale(navigator.language)
  );

  useEffect(() => {
    getDictionary(lang).then((result) => setDict(result));
  }, [lang]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setGrid((prev) => getNextGeneration(prev));
    }, 100);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="px-5 py-3">
      <div className="flex flex-col mb-4">
      <Image
        src="/logo.svg"
        alt="logo"
        width={100}
        height={100}
        className="dark:invert mt-1.5"
      />
      <span className="text-2xl font-bold mt-3">{dict.title}</span>
      <span className="text-md -mt-1">{dict.description}</span>
      </div>
      <GameBoard grid={grid} setGrid={setGrid} running={running} mode={mode} />
      <button onClick={() => setRunning(!running)}>
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
};

export default AppPage;
