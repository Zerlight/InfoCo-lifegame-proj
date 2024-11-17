import React, { useRef, useEffect, useState } from "react";

type GameBoardProps = {
  rows?: number;
  cols?: number;
  cellSize?: number;
  grid: boolean[][];
  setGrid: React.Dispatch<React.SetStateAction<boolean[][]>>;
};

const GameBoard: React.FC<GameBoardProps> = ({
  rows = 50,
  cols = 50,
  cellSize = 10,
  grid,
  setGrid,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "#ddd";
    for (let i = 0; i <= rows; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(cols * cellSize, i * cellSize);
      ctx.stroke();
    }
    for (let j = 0; j <= cols; j++) {
      ctx.beginPath();
      ctx.moveTo(j * cellSize, 0);
      ctx.lineTo(j * cellSize, rows * cellSize);
      ctx.stroke();
    }

    // Draw cells
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j]) {
          ctx.fillStyle = "#000";
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  const handleInput = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      setGrid((prev) => {
        const newGrid = prev.map((row) => [...row]);
        newGrid[y][x] = !newGrid[y][x];
        return newGrid;
      });
    }
  };

  useEffect(() => {
    drawGrid();
  }, [grid]);

  return (
    <canvas
      ref={canvasRef}
      width={cols * cellSize}
      height={rows * cellSize}
      onMouseDown={(e) => handleInput(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleInput(touch.clientX, touch.clientY);
      }}
    />
  );
};

export default GameBoard;
