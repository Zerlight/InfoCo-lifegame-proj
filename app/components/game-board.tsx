import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

type GameBoardProps = {
  rows?: number;
  cols?: number;
  cellSize?: number;
  grid: boolean[][];
  setGrid: React.Dispatch<React.SetStateAction<boolean[][]>>;
  running: boolean;
  mode: "draw" | "erase";
};

export interface GameBoardHandles {
  getCanvasBase64: () => string | undefined;
}

const GameBoard = forwardRef<GameBoardHandles, GameBoardProps>(({
  rows = 50,
  cols = 50,
  cellSize = 10,
  grid,
  setGrid,
  running,
  mode = "draw"
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useImperativeHandle(ref, () => ({
    getCanvasBase64() {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      drawGrid(false); // Draw without grid lines for export
      const base64 = canvas.toDataURL('image/png');
      drawGrid(true); // Redraw with grid lines for continued editing
      return base64;
    }
  }));
  if (typeof grid === "undefined" || typeof grid[0] === "undefined") {
    throw new Error("Grid is not defined.\nPlease initalize the grid as a 2D array of booleans.");
  }

  const drawGrid = (flag: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = "#ddd";
    if(flag){
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
    }

    // Draw cells
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (grid[i][j]) {
          ctx.fillStyle = "#607D8B";
          ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  const getCellCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) / cellSize);
    const y = Math.floor((clientY - rect.top) / cellSize);

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      return { x, y };
    }
    return null;
  };

  const toggleCell = (clientX: number, clientY: number) => {
    const coords = getCellCoordinates(clientX, clientY);
    if (!coords) return;

    const { x, y } = coords;
    setGrid((prev) => {
      const newGrid = prev.map((row) => [...row]);
      newGrid[y][x] =
        mode === "draw" ? true : mode === "erase" ? false : !newGrid[y][x];
      return newGrid;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (running) return;
    setIsDrawing(true);
    toggleCell(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (running || !isDrawing) return;
    toggleCell(e.clientX, e.clientY);
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (running) return;
    setIsDrawing(true);
    const touch = e.touches[0];
    toggleCell(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (running || !isDrawing) return;
    const touch = e.touches[0];
    toggleCell(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => setIsDrawing(false);

  const getCanvasBase64 = () => {
    drawGrid(false);
    const canvas = canvasRef.current;
    if(canvas){
      const base64 = canvas.toDataURL("image/png");
      drawGrid(true);
      return base64;
    }
    
  }

  useEffect(() => {
    drawGrid(true);
  }, [grid]);

  return (
    <canvas
      ref={canvasRef}
      width={cols * cellSize}
      height={rows * cellSize}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    />
  );
});

GameBoard.displayName = 'GameBoard';

export default GameBoard;
