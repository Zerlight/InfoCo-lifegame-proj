export const getNextGenerationOptimized = (grid: boolean[][]): boolean[][] => {
  const rows = grid.length;
  const cols = grid[0].length;
  // Next grid initially references existing rows; we only copy a row when a change occurs in that row.
  const nextGrid: boolean[][] = new Array(rows);
  let anyChange = false;

  for (let i = 0; i < rows; i++) {
    const row = grid[i];
    let newRow: boolean[] | null = null; // lazily clone when first change in this row

    for (let j = 0; j < cols; j++) {
      let liveNeighbors = 0;

      // Manually unrolled neighbor checks (avoids array iteration overhead)
      // Top row
      if (i > 0) {
        const prevRow = grid[i - 1];
        if (j > 0 && prevRow[j - 1]) liveNeighbors++;
        if (prevRow[j]) liveNeighbors++;
        if (j + 1 < cols && prevRow[j + 1]) liveNeighbors++;
      }
      // Same row lateral
      if (j > 0 && row[j - 1]) liveNeighbors++;
      if (j + 1 < cols && row[j + 1]) liveNeighbors++;
      // Bottom row
      if (i + 1 < rows) {
        const nextRow = grid[i + 1];
        if (j > 0 && nextRow[j - 1]) liveNeighbors++;
        if (nextRow[j]) liveNeighbors++;
        if (j + 1 < cols && nextRow[j + 1]) liveNeighbors++;
      }

      const cellAlive = row[j];
      let nextAlive = cellAlive;
      if (cellAlive) {
        if (liveNeighbors < 2 || liveNeighbors > 3) nextAlive = false;
      } else {
        if (liveNeighbors === 3) nextAlive = true;
      }

      if (nextAlive !== cellAlive) {
        if (!newRow) {
          // First change in this row; clone row
            newRow = row.slice();
        }
        newRow[j] = nextAlive;
        anyChange = true;
      }
    }

    nextGrid[i] = newRow ? newRow : row; // reuse original row if unchanged
  }

  return anyChange ? nextGrid : grid; // return original reference if no change => React skips re-render
};
