'use client'

import React, { useState, useEffect } from "react";
import GameBoard from "@/app/components/game-board";
import { getNextGeneration } from "@/app/utils/game-logic";
import { getDictionary } from './dictionaries';

const AppPage = ({ params: { lang } }: { params: { lang: string } }) => {
  const [running, setRunning] = useState(false);
  const dict = getDictionary(lang)
  const [grid, setGrid] = useState<boolean[][]>(
    Array.from({ length: 50 }, () => Array(50).fill(false))
  );

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setGrid((prev) => getNextGeneration(prev));
    }, 100);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <GameBoard grid={grid} setGrid={setGrid} />
      <button onClick={() => setRunning(!running)}>
        {running ? "Stop" : "Start"}
      </button>
    </div>
  );
};

export default AppPage;