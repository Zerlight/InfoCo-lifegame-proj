import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useLayoutEffect,
} from "react";

type GameBoardProps = {
  rows?: number;
  cols?: number;
  cellSize?: number;
  grid: boolean[][];
  setGrid: React.Dispatch<React.SetStateAction<boolean[][]>>;
  running: boolean;
  mode: "draw" | "erase";
  drawGridLines?: boolean;
};

export interface GameBoardHandles {
  getDivinatoryTrigrams: () => number[];
  getCanvasBase64: () => string | undefined;
}

const GameBoard = forwardRef<GameBoardHandles, GameBoardProps>(
  (
    {
      rows = 50,
      cols = 50,
      cellSize = 10,
      grid,
      setGrid,
      running,
      mode = "draw",
      drawGridLines = true,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const requestRef = useRef<number>();
    const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
    const [isDrawing, setIsDrawing] = useState(false);

    useImperativeHandle(ref, () => ({
      getDivinatoryTrigrams() {
        const aliveCellNumber: number[] = [0, 0, 0, 0, 0, 0];
        let counter: number = 0;
        console.log("Grid dimensions:", grid.length, "x", grid[0].length);
        console.log("Rows:", rows, "Cols:", cols);

        for (let bi = 0; bi < 2; bi++) {
          for (let bj = 0; bj < 3; bj++) {
            console.log(`Block: bi=${bi}, bj=${bj}`);
            const startI = Math.floor((bi * rows) / 2);
            const endI = Math.floor(((bi + 1) * rows) / 2);
            const startJ = Math.floor((bj * cols) / 3);
            const endJ = Math.floor(((bj + 1) * cols) / 3);

            console.log(
              `Scanning area: i=${startI}-${endI}, j=${startJ}-${endJ}`
            );

            for (let i = startI; i < endI; i++) {
              for (let j = startJ; j < endJ; j++) {
                if (grid[i]?.[j] === true) {
                  aliveCellNumber[counter] += 1;
                }
              }
            }
            counter++;
          }
        }
        console.log("Alive cell counts:", aliveCellNumber);
        return aliveCellNumber.map((num) => num % 4);
      },
      getCanvasBase64() {
        const canvas = canvasRef.current;
        if (canvas) {
          const base64 = canvas.toDataURL("image/png");
          return base64;
        }
      },
    }));

    if (typeof grid === "undefined" || typeof grid[0] === "undefined") {
      throw new Error(
        "Grid is not defined.\nPlease initalize the grid as a 2D array of booleans."
      );
    }

    const updateDimensions = useCallback(() => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      const newCols = Math.floor(newWidth / cellSize);
      const newRows = Math.floor(newHeight / cellSize);

      setDimensions({ width: newWidth, height: newHeight });

      setGrid((prevGrid) => {
        const newGrid = Array(newRows)
          .fill(0)
          .map(() => Array(newCols).fill(false));

        for (let i = 0; i < Math.min(prevGrid.length, newRows); i++) {
          for (let j = 0; j < Math.min(prevGrid[0].length, newCols); j++) {
            newGrid[i][j] = prevGrid[i][j];
          }
        }

        return newGrid;
      });
    }, [cellSize, setGrid]);

    useEffect(() => {
      if (!containerRef.current) return;

      const observer = new ResizeObserver(updateDimensions);
      observer.observe(containerRef.current);

      updateDimensions();

      return () => observer.disconnect();
    }, [updateDimensions]);

    const drawGrid = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = grid[0].length * cellSize;
      canvas.height = grid.length * cellSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (drawGridLines) {
        ctx.strokeStyle = "#ddd";
        for (let i = 0; i <= grid.length; i++) {
          ctx.beginPath();
          ctx.moveTo(0, i * cellSize);
          ctx.lineTo(canvas.width, i * cellSize);
          ctx.stroke();
        }
        for (let j = 0; j <= grid[0].length; j++) {
          ctx.beginPath();
          ctx.moveTo(j * cellSize, 0);
          ctx.lineTo(j * cellSize, canvas.height);
          ctx.stroke();
        }
      }

      for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[0].length; j++) {
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
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = Math.floor(((clientX - rect.left) * scaleX) / cellSize);
      const y = Math.floor(((clientY - rect.top) * scaleY) / cellSize);

      if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
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

    const animate = () => {
      drawGrid();
      requestRef.current = requestAnimationFrame(animate);
    };

    useLayoutEffect(() => {
      animate();

      return () => {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      };
    }, [cols, rows, cellSize, dimensions, grid, drawGridLines]);

    return (
      <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
        <canvas
          ref={canvasRef}
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
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  }
);

GameBoard.displayName = "GameBoard";

export default GameBoard;
