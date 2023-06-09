import { INVALID_MOVE } from 'boardgame.io/core';

import { defineHex, Grid, spiral, ring, Direction, line } from 'honeycomb-grid'
// import { SVG } from '@svgdotjs/svg.js'

export type StoneColor = "black" | "white";
export type Stone = {
  color: StoneColor;
  q: number;
  r: number;
};
export type StonePair = [Stone, Stone];
export type ParadoxMove = {
  src: StonePair,
  dest: StonePair,
};

const GRID_CENTER: [number, number] = [3, 3];
const GRID_RADIUS = 3;

function makeGrid() {
  const Tile = defineHex({ origin: 'topLeft', dimensions: 30, });
  return new Grid(Tile, spiral({ start: GRID_CENTER, radius: GRID_RADIUS }));
}

const GRID = makeGrid();

function setup() {
  const outer_ring_traverer = ring({ center: GRID_CENTER, radius: GRID_RADIUS });
  let stones: Stone[] = [];
  let c: StoneColor = 'white';
  GRID.traverse(outer_ring_traverer).forEach(hex => {
    stones.push({ color: c, q: hex.q, r: hex.r });
    c = c === "white" ? "black" : "white";
  });
  let mb = GRID.neighborOf(GRID_CENTER, Direction.E)!;
  stones.push({ color: "black", q: mb.q, r: mb.r });
  let mw = GRID.neighborOf(GRID_CENTER, Direction.W)!;
  stones.push({ color: "white", q: mw.q, r: mw.r });

  return { grid: JSON.stringify(GRID), stones: stones, };
}

function pointyDirections(): Direction[] {
  return [Direction.NE, Direction.E, Direction.SE, Direction.SW, Direction.W, Direction.NW];
}

function pickStone({ G, events }, id) {
  const idhex = GRID.getHex(id);
  if (idhex) {
    let stone_i = G.stones.findIndex(s => isSameHex(s, idhex));
    let color = stone_i === -1 ? null : G.stones[stone_i].color;
    if (color) {
      const stone = G.stones[stone_i];
      if (G.current.length === 0) {
        G.current.push(stone_i);
        return;
      } else if (G.current.length === 1) {
        const prev = G.stones[G.current[0]];;
        if (isSameHex(prev, stone)) {
          G.current.pop();
          return;
        } else if (stone.color !== prev.color && GRID.distance(stone, prev) === 1) {
          G.current.push(stone_i);
        }
      }
    }
  }
  if (G.current.length === 2) {
    events.setActivePlayers!({ currentPlayer: "putdown" });
    return;
  }
  return INVALID_MOVE;
}

function neighborDirection(src: { q: number, r: number }, wanted: { q: number, r: number }): { q: number, r: number } {
  return { q: src.q - wanted.q, r: src.r - wanted.r };
}

function isSameHex(h1, h2): boolean {
  return h1.q === h2.q && h1.r === h2.r;
}

function isSamePair(p1, p2): boolean {
  return (
    (isSameHex(p1[0], p2[0]) && isSameHex(p1[1], p2[1]))
    || (isSameHex(p1[0], p2[1]) && isSameHex(p1[1], p2[0]))
  );
}

function isUndo(G, move): boolean {
  if (G.history.length === 0) { return false; }
  const last_move = G.history[G.history.length - 1];
  return isSamePair(last_move.src, move.dest) && isSamePair(last_move.dest, move.src);
}

function movePair(grid, stones, pair: StonePair, dest: { q: number, r: number }) {
  if (grid.getHex(dest) && stones.findIndex(s => isSameHex(s, dest))===-1) {
    const dist1 = grid.distance(dest, pair[1]);
    if (dist1 === 1) {
      const delta = neighborDirection(pair[1], dest);
      console.debug([pair[1].q, pair[1].r], "=>", dest, "in direction", delta);
      let dest0 = { q: pair[0].q - delta.q, r: pair[0].r - delta.r };
      console.debug([pair[0].q, pair[0].r], "in direction", delta, "=>", dest0);
      if (grid.getHex(dest0)) {
        if (isSameHex(dest0, pair[1]) || stones.findIndex(s => isSameHex(s, dest0)) === -1) {
          return {
            src: [{ ...pair[0] }, { ...pair[1] }],
            dest: [
              { q: dest0.q, r: dest0.r, color: pair[0].color },
              { q: dest.q, r: dest.r, color: pair[1].color },
            ],
          };
        }
      }
    }
  }
  return null;
}

function putStone({ G, events }, id) {
  const idhex = GRID.getHex(id);
  if (idhex) {
    let stone0 = G.stones[G.current[0]];
    let stone1 = G.stones[G.current[1]];
    if (isSameHex(stone0, idhex) || isSameHex(stone1, idhex)) {
      let this_move = { src: [{ ...stone0 }, { ...stone1 }], dest: [{ ...stone1 }, { ...stone0 }], };
      if (!isUndo(G, this_move)) {
        G.history.push(this_move);
        let temp = stone0.color;
        stone0.color = stone1.color;
        stone1.color = temp;
        events.endTurn();
        return;
      }
    } else {
      let this_move = movePair(GRID, G.stones, [stone0, stone1], idhex);
      if (this_move != null){
        if (!isUndo(G, this_move)) {
          G.history.push(this_move);
          stone1.q = idhex.q;
          stone1.r = idhex.r;
          stone0.q = this_move.dest[0].q;
          stone0.r = this_move.dest[0].r;
          events.endTurn();
          return;
        }
      }
    }
  }
  return INVALID_MOVE;
}

function undo({ G, events }) {
  if (G.history.length === 0) {
    return INVALID_MOVE;
  }
  const to_undo = G.history.pop();
  const stone0_i = G.stones.findIndex(s => isSameHex(s, to_undo.dest[0]));
  const stone1_i = G.stones.findIndex(s => isSameHex(s, to_undo.dest[1]));
  G.stones[stone0_i].q = to_undo.src[0].q;
  G.stones[stone0_i].r = to_undo.src[0].r;
  G.stones[stone1_i].q = to_undo.src[1].q;
  G.stones[stone1_i].r = to_undo.src[1].r;
  events.endTurn();
}

function clear({ G, events }) {
  G.current = [];
  events.setActivePlayers!({ currentPlayer: "pickup" });
}

function fullMove({ G, events }, ...id) {
  if (id === null || id.length !== 6) { return INVALID_MOVE; }
  pickStone({ G, events }, id.slice(0, 2));
  pickStone({ G, events }, id.slice(2, 4));
  putStone({ G, events }, id.slice(4, 6));
}

export const Paradox = {
  setup: () => ({
    ...setup(),
    history: [], current: [], winner: null, winning_line: null,
    players: {
      0: { color: "white", },
      1: { color: "black", },
    },
  }
  ),

  turn: {
    onBegin: ({ G, events }) => {
      G.current = [];
      events.setActivePlayers!({ currentPlayer: "pickup" });
    },
    stages: {
      pickup: {
        moves: {
          clickCell: pickStone,
          undo,
          clear,
          fullMove, // a hack for the AI
        },
        next: 'putdown',
      },
      putdown: {
        moves: {
          clickCell: putStone,
          clear,
        },
      },
    },

    onEnd: ({ G, events }) => {
      if (G.history.length === 0) { return; }
      if (G.current.length < 2) { return; }
      checkWin(G, events);
    },
  },

  endIf: ({ G }) => {
    if (G.winner) {
      return {
        color: G.winner,
        winning_line: G.winning_line,
        winner: Object.keys(G.players).find((k) => G.players[k].color === G.winner),
      };
    }
  },

  ai: {
    enumerate: (G, ctx) => {
      if (ctx.gameover) {
        return [];
      }
      function pairStone(grid, stone, stones) {
        return pointyDirections()
          .map(d => grid.neighborOf(stone, d))
          .filter(h => grid.getHex(h))
          .map(h => stones.find(s => isSameHex(h, s)))
          .filter(Boolean)
          .filter(s => s.color !== stone.color);
      }
      const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

      function pairMoves(grid, pair, stones) {
        return [Direction.NE, Direction.E, Direction.SE, Direction.SW, Direction.W, Direction.NW,]
          .map(d => grid.neighborOf(pair[1], d))
          .map(h => movePair(grid, stones, pair, h))
          .filter(Boolean)
      }

      let switches: StonePair[] = [];
      G.stones.forEach(s => cartesian([s], pairStone(GRID, s, G.stones)).forEach((p: StonePair) => switches.push(p)));
      let moves: any = [];
      switches.forEach(s => pairMoves(GRID, s, G.stones).forEach(m => moves.push(m)));
      let switch_moves = switches.map(m => {
        return {
          src: [
            { q: m[0].q, r: m[0].r },
            { q: m[1].q, r: m[1].r },
          ],
          dest: [
            { q: m[1].q, r: m[1].r },
            { q: m[0].q, r: m[0].r },
          ],
        };
      });
      moves = [...switch_moves, ...moves];
      return moves
        .filter(m => !isUndo(G, m))
        .map(m => {
          return { move: 'fullMove', args: [m.src[0].q, m.src[0].r, m.src[1].q, m.src[1].r, m.dest[1].q, m.dest[1].r] };
        }
        ).filter(m => m.args?.length === 6);
    },
  },
};

function isLineWin(grid, stones, line_traverser): boolean {
  let color = null;
  let length = 0;
  grid.traverse(line_traverser, { bail: true }).forEach(hex => {
    // console.log(length, hex);
    let stone_i = stones.findIndex(s => s.q === hex.q && s.r === hex.r);
    if (stone_i === -1) {
      // console.log("stopped cause empty");
      return false;
    } else if (color === null) {
      color = stones[stone_i].color;
    } else if (color !== stones[stone_i].color) {
      // console.log("stopped cause color changed");
      return false;
    }
    length++;
  });
  return length >= 4;
}

function checkWin(G, events) {
  console.log("checkWin");

  G.stones.forEach(h => {
    // console.log(h);
    pointyDirections()
      .forEach(d => {
        // console.log("Direction", d);
        const line_t = line({ start: h, direction: d, length: 4 });
        if (isLineWin(GRID, G.stones, line_t)) {
          G.winner = h.color;
          G.winning_line = [];
          GRID.traverse(line_t, { bail: true }).forEach(h => G.winning_line.push({ q: h.q, r: h.r }));
          return;
        }
      });
  });
}
