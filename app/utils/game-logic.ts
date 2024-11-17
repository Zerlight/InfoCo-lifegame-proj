export const getNextGeneration = (grid: boolean[][]): boolean[][] => {
    const rows = grid.length;
    const cols = grid[0].length;
    const nextGrid = grid.map((row) => [...row]);
  
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1] ,          [0, 1] ,
      [1, -1] , [1, 0] , [1, 1] ,
    ];
  
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        let liveNeighbors = 0;
  
        directions.forEach(([dx, dy]) => {
          const x = i + dx;
          const y = j + dy;
          if (x >= 0 && x < rows && y >= 0 && y < cols) {
            liveNeighbors += grid[x][y] ? 1 : 0;
          }
        });
  
        if (grid[i][j]) {
          if (liveNeighbors < 2 || liveNeighbors > 3) {
            nextGrid[i][j] = false;
          }
        } else {
          if (liveNeighbors === 3) {
            nextGrid[i][j] = true;
          }
        }
      }
    }
  
    return nextGrid;
  };
  