// Web Worker (Bitset Optimized) for Game of Life
// Main -> Worker:
//   init: { type:'init', rows, cols, buffer(bitset), baseInterval, speed }
//   updateSpeed: { type:'updateSpeed', speed }
//   stop: { type:'stop' }
// Worker -> Main:
//   patch: { type:'patch', rows:ArrayBuffer(Int32Array), data:ArrayBuffer(Uint8Array), bytesPerRow:number, cols:number }
//   stabilized: { type:'stabilized' }

interface InitMsg { type:'init'; rows:number; cols:number; buffer:ArrayBuffer; baseInterval:number; speed:number }
interface UpdateSpeedMsg { type:'updateSpeed'; speed:number }
interface StopMsg { type:'stop' }
type InMsg = InitMsg | UpdateSpeedMsg | StopMsg;

const ctx: any = globalThis as any;

let rows = 0;
let cols = 0;
let bytesPerRow = 0;
let current!: Uint8Array; // bitset
let next!: Uint8Array;    // bitset buffer
let running = false;
let speed = 1;
let baseInterval = 200;
let timer: number | null = null;
let stableCounter = 0;
let adaptiveThreshold = 5;

const clearTimer = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };

// Bit helpers
const getBit = (buf: Uint8Array, r: number, c: number) => {
  const offset = r * bytesPerRow + (c >> 3);
  return (buf[offset] >> (c & 7)) & 1;
};
const setBit = (buf: Uint8Array, r: number, c: number, val: number) => {
  const offset = r * bytesPerRow + (c >> 3);
  if (val) buf[offset] |= (1 << (c & 7));
  else buf[offset] &= ~(1 << (c & 7));
};

const step = (): { anyChange: boolean; changedRowCount: number } => {
  let anyChange = false;
  let changedRows = 0;
  for (let r = 0; r < rows; r++) {
    let rowChanged = false;
    for (let c = 0; c < cols; c++) {
      let n = 0;
      const rTop = r - 1;
      const rBot = r + 1;
      if (rTop >= 0) {
        if (c > 0 && getBit(current, rTop, c - 1)) n++;
        if (getBit(current, rTop, c)) n++;
        if (c + 1 < cols && getBit(current, rTop, c + 1)) n++;
      }
      if (c > 0 && getBit(current, r, c - 1)) n++;
      if (c + 1 < cols && getBit(current, r, c + 1)) n++;
      if (rBot < rows) {
        if (c > 0 && getBit(current, rBot, c - 1)) n++;
        if (getBit(current, rBot, c)) n++;
        if (c + 1 < cols && getBit(current, rBot, c + 1)) n++;
      }
      const alive = getBit(current, r, c) === 1;
      let nextAlive = alive;
      if (alive) {
        if (n < 2 || n > 3) nextAlive = false;
      } else if (n === 3) nextAlive = true;
      if (nextAlive !== alive) {
        setBit(next, r, c, nextAlive ? 1 : 0);
        anyChange = true;
        rowChanged = true;
      } else {
        // copy unchanged
        setBit(next, r, c, alive ? 1 : 0);
      }
    }
    if (rowChanged) changedRows++;
  }
  return { anyChange, changedRowCount: changedRows };
};

const diffAndSend = (): boolean => {
  const changedRowIdx: number[] = [];
  for (let r = 0; r < rows; r++) {
    const off = r * bytesPerRow;
    let rowDifferent = false;
    for (let b = 0; b < bytesPerRow; b++) {
      if (current[off + b] !== next[off + b]) { rowDifferent = true; break; }
    }
    if (rowDifferent) changedRowIdx.push(r);
  }
  if (changedRowIdx.length === 0) return false;
  const rowCount = changedRowIdx.length;
  const rowsIdxArr = new Int32Array(rowCount);
  const dataArr = new Uint8Array(rowCount * bytesPerRow);
  for (let i = 0; i < rowCount; i++) {
    const r = changedRowIdx[i];
    rowsIdxArr[i] = r;
    const srcStart = r * bytesPerRow;
    dataArr.set(next.subarray(srcStart, srcStart + bytesPerRow), i * bytesPerRow);
  }
  // Commit by copying next -> current
  current.set(next);
  ctx.postMessage({ type:'patch', rows: rowsIdxArr.buffer, data: dataArr.buffer, bytesPerRow, cols }, [rowsIdxArr.buffer, dataArr.buffer]);
  return true;
};

const schedule = () => {
  if (!running) return;
  const interval = baseInterval / (speed || 1);
  timer = setTimeout(stepLoop, interval) as unknown as number;
};

const stepLoop = () => {
  if (!running) return;
  const { anyChange, changedRowCount } = step();
  if (!anyChange) {
    stableCounter++;
  } else {
    stableCounter = 0;
    diffAndSend();
  }
  // Adaptive threshold: scale with log(boardSize) and sparsity
  const totalCells = rows * cols;
  const density = changedRowCount / rows; // changed row ratio
  adaptiveThreshold = Math.min(30, Math.max(3, Math.round(Math.log2(totalCells + 1))));
  if (density < 0.02) adaptiveThreshold = Math.max(3, adaptiveThreshold - 2);
  if (stableCounter >= adaptiveThreshold) {
    ctx.postMessage({ type:'stabilized' });
    running = false;
    clearTimer();
    return;
  }
  schedule();
};

ctx.onmessage = (e: MessageEvent<InMsg>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init': {
      clearTimer();
      rows = msg.rows;
      cols = msg.cols;
      baseInterval = msg.baseInterval;
      speed = msg.speed;
      bytesPerRow = Math.ceil(cols / 8);
      const incoming = new Uint8Array(msg.buffer);
      current = new Uint8Array(incoming); // bitset copy
      next = new Uint8Array(current.length);
      running = true;
      stableCounter = 0;
      adaptiveThreshold = 5;
      schedule();
      break; }
    case 'updateSpeed': {
      speed = msg.speed;
      if (running) { clearTimer(); schedule(); }
      break; }
    case 'stop': {
      running = false;
      clearTimer();
      break; }
  }
};
