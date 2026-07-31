import { BOARD_SIZE } from './constants.js';

const VECTORS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1]
];

export function cellKey(row, column) {
  return `${row}:${column}`;
}

export function isHarmonic(ranks) {
  const ascending = ranks.every((rank, index) => rank === index + 1);
  const descending = ranks.every((rank, index) => rank === 5 - index);
  return ascending || descending;
}

export function findQuints(board) {
  const lines = [];
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      for (const [rowStep, columnStep] of VECTORS) {
        const endRow = row + rowStep * 4;
        const endColumn = column + columnStep * 4;
        if (endRow < 0 || endRow >= BOARD_SIZE || endColumn < 0 || endColumn >= BOARD_SIZE) continue;
        const cells = [];
        const ranks = [];
        let complete = true;
        for (let offset = 0; offset < 5; offset += 1) {
          const targetRow = row + rowStep * offset;
          const targetColumn = column + columnStep * offset;
          const core = board[targetRow][targetColumn];
          if (!core) {
            complete = false;
            break;
          }
          cells.push({ row: targetRow, column: targetColumn });
          ranks.push(core.rank);
        }
        if (!complete) continue;
        const sorted = [...ranks].sort((a, b) => a - b);
        if (sorted.join(',') !== '1,2,3,4,5') continue;
        lines.push({
          id: cells.map(({ row: itemRow, column: itemColumn }) => cellKey(itemRow, itemColumn)).join('|'),
          cells,
          ranks,
          harmonic: isHarmonic(ranks)
        });
      }
    }
  }
  return lines.sort((a, b) => a.id.localeCompare(b.id));
}

export function quintUnion(lines) {
  const cells = new Map();
  for (const line of lines) {
    for (const cell of line.cells) cells.set(cellKey(cell.row, cell.column), cell);
  }
  return [...cells.values()];
}

export function hasCross(lines) {
  const counts = new Map();
  for (const line of lines) {
    for (const cell of line.cells) {
      const key = cellKey(cell.row, cell.column);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.values()].some((count) => count > 1);
}
