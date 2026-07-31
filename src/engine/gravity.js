import { BOARD_SIZE } from './constants.js';

function cloneCore(core, row, column) {
  return { ...core, row, column };
}

export function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

/** Compact the board along one direction while preserving lane order. */
export function applyGravity(board, direction) {
  const next = emptyBoard();
  const movedIds = new Set();

  if (direction === 'DOWN' || direction === 'UP') {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const cores = [];
      const rows = direction === 'DOWN'
        ? Array.from({ length: BOARD_SIZE }, (_, index) => BOARD_SIZE - 1 - index)
        : Array.from({ length: BOARD_SIZE }, (_, index) => index);
      for (const row of rows) if (board[row][column]) cores.push(board[row][column]);
      cores.forEach((core, index) => {
        const targetRow = direction === 'DOWN' ? BOARD_SIZE - 1 - index : index;
        next[targetRow][column] = cloneCore(core, targetRow, column);
        if (core.row !== targetRow || core.column !== column) movedIds.add(core.id);
      });
    }
  } else {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      const cores = [];
      const columns = direction === 'RIGHT'
        ? Array.from({ length: BOARD_SIZE }, (_, index) => BOARD_SIZE - 1 - index)
        : Array.from({ length: BOARD_SIZE }, (_, index) => index);
      for (const column of columns) if (board[row][column]) cores.push(board[row][column]);
      cores.forEach((core, index) => {
        const targetColumn = direction === 'RIGHT' ? BOARD_SIZE - 1 - index : index;
        next[row][targetColumn] = cloneCore(core, row, targetColumn);
        if (core.row !== row || core.column !== targetColumn) movedIds.add(core.id);
      });
    }
  }

  return { board: next, movedIds };
}

export function gravityOrder(direction) {
  const cells = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) cells.push({ row, column });
  }
  return cells.sort((a, b) => {
    if (direction === 'DOWN') return b.row - a.row || a.column - b.column;
    if (direction === 'UP') return a.row - b.row || a.column - b.column;
    if (direction === 'RIGHT') return b.column - a.column || a.row - b.row;
    return a.column - b.column || a.row - b.row;
  });
}
