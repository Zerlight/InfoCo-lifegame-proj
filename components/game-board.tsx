import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from "react";
// @ts-ignore - allow importing worker file (depends on bundler config)
import SimulationWorker from "../workers/simulation.worker.ts?worker";

type GameBoardProps = {
  rows?: number;
  cols?: number;
  cellSize?: number;
  grid: boolean[][];
  setGrid: React.Dispatch<React.SetStateAction<boolean[][]>>;
  running: boolean;
  mode: "draw" | "erase";
  drawGridLines?: boolean;
  speed?: number; // simulation speed multiplier
  onStabilized?: () => void; // callback when simulation stabilizes (no changes for adaptive threshold generations)
};

export interface GameBoardHandles {
  getDivinatoryTrigrams: () => number[];
  getCanvasBase64: () => string | undefined;
}

const GameBoard = forwardRef<GameBoardHandles, GameBoardProps>(function GameBoard(
  {
    rows = 50,
    cols = 50,
    cellSize = 10,
    grid,
    setGrid,
    running,
    mode = "draw",
    drawGridLines = true,
  speed = 2,
  onStabilized,
  },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Refs for performant redraw loop
  const gridRef = useRef(grid);
  const drawGridLinesRef = useRef(drawGridLines);
  const cellSizeRef = useRef(cellSize);
  const needsRedrawRef = useRef(true);
  const workerRef = useRef<Worker | null>(null);
  const stabilizedRef = useRef(false);
  const fallbackRAFRef = useRef<number | null>(null);
  const onStabilizeRef = useRef<(() => void) | null>(null);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    gridRef.current = grid;
    needsRedrawRef.current = true;
  }, [grid]);
  useEffect(() => {
    drawGridLinesRef.current = drawGridLines;
    needsRedrawRef.current = true;
  }, [drawGridLines]);
  useEffect(() => {
    cellSizeRef.current = cellSize;
    needsRedrawRef.current = true;
  }, [cellSize]);

  useImperativeHandle(ref, () => ({
    getDivinatoryTrigrams() {
      const g = gridRef.current;
      const totalRows = rows || g.length;
      const totalCols = cols || (g[0]?.length || 0);
      const aliveCellNumber: number[] = [0, 0, 0, 0, 0, 0];
      let counter = 0;
      for (let bi = 0; bi < 2; bi++) {
        for (let bj = 0; bj < 3; bj++) {
          const startI = Math.floor((bi * totalRows) / 2);
          const endI = Math.floor(((bi + 1) * totalRows) / 2);
          const startJ = Math.floor((bj * totalCols) / 3);
          const endJ = Math.floor(((bj + 1) * totalCols) / 3);
          for (let i = startI; i < endI; i++) {
            for (let j = startJ; j < endJ; j++) {
              if (g[i]?.[j]) aliveCellNumber[counter] += 1;
            }
          }
          counter++;
        }
      }
      return aliveCellNumber.map((n) => n % 4);
    },
    getCanvasBase64() {
      const canvas = canvasRef.current;
      if (canvas) return canvas.toDataURL("image/png");
    },
  }));

  if (!grid || !grid[0]) {
    throw new Error("Grid is not defined. Initialize as boolean[][]");
  }

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const currentGrid = gridRef.current;
    const cs = cellSizeRef.current;
    const width = currentGrid[0].length * cs;
    const height = currentGrid.length * cs;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
    }
    ctx.clearRect(0, 0, width, height);
    // 1. Fill live cells first so grid lines appear above (previously cells hid top/left stroke lines)
    ctx.fillStyle = "#607D8B";
    for (let i = 0; i < currentGrid.length; i++) {
      const row = currentGrid[i];
      for (let j = 0; j < row.length; j++) {
        if (row[j]) ctx.fillRect(j * cs, i * cs, cs, cs);
      }
    }
    // 2. Draw inner grid lines over cell fills for consistent visibility all sides
    if (drawGridLinesRef.current) {
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      for (let i = 1; i < currentGrid.length; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * cs + 0.5);
        ctx.lineTo(width, i * cs + 0.5);
        ctx.stroke();
      }
      for (let j = 1; j < currentGrid[0].length; j++) {
        ctx.beginPath();
        ctx.moveTo(j * cs + 0.5, 0);
        ctx.lineTo(j * cs + 0.5, height);
        ctx.stroke();
      }
    }
    if (drawGridLinesRef.current) {
      // outer border drawn last to sit on top of cell fills
      ctx.strokeStyle = "#ddd";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    }
  };

  useEffect(() => {
    let frame: number;
    const loop = () => {
      if (needsRedrawRef.current) {
        draw();
        needsRedrawRef.current = false;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const getCellCoordinates = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const currentGrid = gridRef.current;
    const cs = cellSizeRef.current;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((clientX - rect.left) * scaleX) / cs);
    const y = Math.floor(((clientY - rect.top) * scaleY) / cs);
    if (y >= 0 && y < currentGrid.length && x >= 0 && x < currentGrid[0].length) return { x, y };
    return null;
  };

  const applyCell = (x: number, y: number, modeLocal = mode) => {
    setGrid((prev) => {
      if (!prev[y]) return prev;
      const next = prev.map((r) => [...r]);
      next[y][x] = modeLocal === "draw" ? true : modeLocal === "erase" ? false : !next[y][x];
      gridRef.current = next; // sync immediately to avoid lag/mismatch
      return next;
    });
    needsRedrawRef.current = true;
  };

  const toggleCell = (clientX: number, clientY: number) => {
    const pos = getCellCoordinates(clientX, clientY);
    if (!pos) return;
    applyCell(pos.x, pos.y);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (running) return;
    setIsDrawing(true);
    toggleCell(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || running) return;
    toggleCell(e.clientX, e.clientY);
  };
  const handleMouseUp = () => setIsDrawing(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (running) return;
    setIsDrawing(true);
    const t = e.touches[0];
    toggleCell(t.clientX, t.clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing || running) return;
    const t = e.touches[0];
    toggleCell(t.clientX, t.clientY);
  };
  const handleTouchEnd = () => setIsDrawing(false);

  useEffect(() => {
    needsRedrawRef.current = true;
  }, [grid.length, grid[0].length]);

  // Optimized in-place like simulation with lazy row cloning
  const stepSimulation = (source: boolean[][]): boolean[][] => {
    const rowsLocal = source.length;
    const colsLocal = source[0].length;
    let changed = false;
    const next: boolean[][] = new Array(rowsLocal);
    for (let i = 0; i < rowsLocal; i++) {
      const row = source[i];
      let newRow: boolean[] | null = null;
      for (let j = 0; j < colsLocal; j++) {
        let n = 0;
        // neighbors (manual bounds checks)
        if (i > 0) {
          const pr = source[i - 1];
          if (j > 0 && pr[j - 1]) n++;
          if (pr[j]) n++;
          if (j + 1 < colsLocal && pr[j + 1]) n++;
        }
        if (j > 0 && row[j - 1]) n++;
        if (j + 1 < colsLocal && row[j + 1]) n++;
        if (i + 1 < rowsLocal) {
          const nr = source[i + 1];
          if (j > 0 && nr[j - 1]) n++;
            if (nr[j]) n++;
          if (j + 1 < colsLocal && nr[j + 1]) n++;
        }
        const alive = row[j];
        let nextAlive = alive;
        if (alive) {
          if (n < 2 || n > 3) nextAlive = false;
        } else if (n === 3) nextAlive = true;
        if (nextAlive !== alive) {
          if (!newRow) newRow = row.slice();
          newRow[j] = nextAlive;
          changed = true;
        }
      }
      next[i] = newRow ? newRow : row;
    }
    return changed ? next : source;
  };

  // Worker-based simulation with fallback
  useEffect(() => {
    if (!running) {
      // stop worker if exists
      if (workerRef.current) workerRef.current.postMessage({ type: "stop" });
      if (fallbackRAFRef.current) {
        cancelAnimationFrame(fallbackRAFRef.current);
        fallbackRAFRef.current = null;
      }
      stabilizedRef.current = false;
      return;
    }
    // lazily create worker
    if (!workerRef.current) {
      try {
        workerRef.current = new SimulationWorker();
        (workerRef.current as Worker).onmessage = (e: MessageEvent) => {
          const data = e.data;
          if (data.type === "patch") {
            const rowIdxArr = new Int32Array(data.rows);
            const cells = new Uint8Array(data.data);
            const bytesPerRow = data.bytesPerRow as number;
            const cols = data.cols as number;
            setGrid((prev) => {
              const next = prev.slice();
              for (let i = 0; i < rowIdxArr.length; i++) {
                const r = rowIdxArr[i];
                const rowBool: boolean[] = new Array(cols);
                const bitsetOffset = i * bytesPerRow;
                for (let c = 0; c < cols; c++) {
                  const byte = cells[bitsetOffset + (c >> 3)];
                  rowBool[c] = ((byte >> (c & 7)) & 1) === 1;
                }
                next[r] = rowBool;
              }
              gridRef.current = next;
              needsRedrawRef.current = true;
              return next;
            });
          } else if (data.type === "stabilized") {
            if (!stabilizedRef.current) {
              stabilizedRef.current = true;
              if (onStabilizeRef.current) onStabilizeRef.current();
            }
          }
        };
      } catch (e) {
        console.warn("Worker initialization failed, using fallback loop", e);
        workerRef.current = null;
      }
    }
    if (workerRef.current) {
      // convert current grid to Uint8Array buffer
      const current = gridRef.current;
      const rows = current.length;
      const cols = current[0].length;
      const bytesPerRow = Math.ceil(cols / 8);
      const buf = new Uint8Array(rows * bytesPerRow);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (current[r][c]) {
            const offset = r * bytesPerRow + (c >> 3);
            buf[offset] |= 1 << (c & 7);
          }
        }
      }
      workerRef.current.postMessage({
        type: "init",
        rows, cols, buffer: buf.buffer,
        baseInterval: 200,
        speed,
      }, [buf.buffer]);
    }
    if (!workerRef.current) {
      // fallback main thread simulation (simple rAF time accumulator) with stabilization detection
      let last = performance.now();
      const baseInterval = 200;
      let unchangedGenerations = 0;
      const maxStableThreshold = () => {
        const g = gridRef.current;
        const size = g.length * g[0].length;
        // mimic adaptive: smaller boards need fewer generations; large boards more
        return Math.max(10, Math.ceil(Math.log2(size) / 2));
      };
      const step = () => {
        if (!running) return;
        const now = performance.now();
        const target = baseInterval / (speedRef.current || 1);
        if (now - last >= target) {
          last = now - ((now - last) % target);
          const prevGrid = gridRef.current;
          // compute next
          const next = (function simulate(prev: boolean[][]) {
            const rowsL = prev.length;
            const colsL = prev[0].length;
            let changed = false;
            const out = new Array(rowsL);
            for (let r = 0; r < rowsL; r++) {
              const row = prev[r];
              let newRow: boolean[] | null = null;
              for (let c = 0; c < colsL; c++) {
                let n = 0;
                if (r > 0) {
                  const pr = prev[r - 1];
                  if (c > 0 && pr[c - 1]) n++;
                  if (pr[c]) n++;
                  if (c + 1 < colsL && pr[c + 1]) n++;
                }
                if (c > 0 && row[c - 1]) n++;
                if (c + 1 < colsL && row[c + 1]) n++;
                if (r + 1 < rowsL) {
                  const nr = prev[r + 1];
                  if (c > 0 && nr[c - 1]) n++;
                  if (nr[c]) n++;
                  if (c + 1 < colsL && nr[c + 1]) n++;
                }
                const alive = row[c];
                let nextAlive = alive;
                if (alive) {
                  if (n < 2 || n > 3) nextAlive = false;
                } else if (n === 3) nextAlive = true;
                if (nextAlive !== alive) {
                  if (!newRow) newRow = row.slice();
                  newRow[c] = nextAlive;
                  changed = true;
                }
              }
              out[r] = newRow ? newRow : row;
            }
            return changed ? out : prev;
          })(prevGrid);
          if (next !== prevGrid) {
            gridRef.current = next;
            setGrid(next);
            needsRedrawRef.current = true;
            unchangedGenerations = 0;
          } else {
            unchangedGenerations++;
            if (!stabilizedRef.current && unchangedGenerations >= maxStableThreshold()) {
              stabilizedRef.current = true;
              if (onStabilizeRef.current) onStabilizeRef.current();
              return; // stop loop
            }
          }
        }
        fallbackRAFRef.current = requestAnimationFrame(step);
      };
      fallbackRAFRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (workerRef.current) workerRef.current.postMessage({ type: "stop" });
      if (fallbackRAFRef.current) {
        cancelAnimationFrame(fallbackRAFRef.current);
        fallbackRAFRef.current = null;
      }
    };
  }, [running]);

  // React to speed changes (worker path handled by message; fallback uses speedRef)
  useEffect(() => {
    if (workerRef.current && running) {
      workerRef.current.postMessage({ type: "updateSpeed", speed });
    }
  }, [speed, running]);

  // Provide external stabilization callback binding
  useEffect(() => {
    onStabilizeRef.current = onStabilized || null;
  }, [onStabilized]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
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
          willChange: "contents",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
});

GameBoard.displayName = "GameBoard";

export default GameBoard;

