import { defineHex, Grid, Hex, spiral } from 'honeycomb-grid'
import { SVG, Svg } from '@svgdotjs/svg.js'
import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer'
import { LobbyClient } from 'boardgame.io/client';
import { Paradox, StoneColor, Stone, ParadoxMove } from './Game';

function parseId(id: string): number[] | null {
  return id.split('_').splice(1, 2).map(x => parseInt(x)) || null;
}

function getCellValue(grid: Grid<Hex>, stones: Stone[], q: number, r: number): StoneColor | null | undefined {
  if (grid.getHex([q, r])) {
    return stones.filter(s => s.q === q && s.r === r).pop()?.color || null;
  } else {
    return undefined;
  }
}

const DRAW_DATA = {
  stroke_width: 3,
  colors: {
    board: '#C4A484',
    stroke: '#999',
    stroke_selected: 'green',
    stroke_won: 'yellow',
  },
};

const SERVER_URL = "https://paradox-ttnk.onrender.com";
class GameClient {
  debug: boolean;
  client: any;
  grid: Grid<Hex>;
  rootElement: any;
  svg: Svg;
  xmin: number;
  xmax: number;
  private _myturn: boolean;
  private _inited: boolean;

  constructor(rootElement, playerID, matchID, playerCredentials, debug = false) {
    this.debug = debug;
    this.client = Client({
      game: Paradox, debug: debug, matchID: matchID, playerID: playerID, credentials: playerCredentials, multiplayer: SocketIO(
        {
          server: SERVER_URL
        })
    });
    this.client.start();
    this._inited = false;

    this.rootElement = rootElement;
    this.svg = SVG().addTo(this.rootElement).attr({ id: 'svgboard', });
    this.createExtraControls();
    this.client.subscribe(state => this.update(state));
  }

  onStart() {
    if (!this._inited) {
      const deserializedGrid = JSON.parse(this.client.getState().G.grid);
      this.grid = Grid.fromJSON(deserializedGrid);

      let xs: number[] = [];
      this.grid.forEach(hex => hex.corners.forEach(({ x }) => xs.push(x)))
      this.xmin = Math.min(...xs);
      this.xmax = Math.max(...xs);

      this.createBoard();
      this.attachListeners();

      this._inited = true;
      this._myturn = false;
    }
  }

  createBoard() {
    this.grid.forEach(hex => {
      // create a polygon from a hex's corner points
      const polygon = this.svg
        .polygon(hex.corners.map(({ x, y }) => [x - this.xmin + DRAW_DATA.stroke_width, y]).reduce((a, b) => a.concat(b), []))
        .fill(DRAW_DATA.colors.board)
        .stroke({ width: DRAW_DATA.stroke_width, color: DRAW_DATA.colors.stroke })
        .attr({ id: `hex_${hex.q}_${hex.r}`, class: 'hex', });

      this.svg.group().add(polygon);
    });
    this.svg.size(this.xmax - this.xmin + 2 * DRAW_DATA.stroke_width);

    if (this.debug) {
      // show q_r coordinates for each cell
      this.grid.forEach(hex => {
        const text = this.svg
          .plain(`${hex.q}_${hex.r}`)
          .stroke({ color: "red", width: 1 })
          .attr({ x: hex.corners[0].x - this.xmin + DRAW_DATA.stroke_width, y: hex.corners[0].y, });
        this.svg.group().add(text);
      });
    }
  }

  createExtraControls() {
    // let undoBtn = this.rootElement.appendChild(document.createElement('button'));
    // undoBtn.id = "undoBtn";
    // undoBtn.type = "button";
    // undoBtn.textContent = "Undo";

    let clearBtn = this.rootElement.appendChild(document.createElement('button'));
    clearBtn.id = "clearBtn";
    clearBtn.type = "button";
    clearBtn.textContent = "Clear Selection";
  }

  attachListeners() {
    const cells = this.rootElement.querySelectorAll('.hex');

    const handleCellClick = event => {
      if (this._myturn) {
        const id = parseId(event.target.id);
        this.client.moves.clickCell(id);
      }
    };
    cells.forEach(cell => {
      cell.onclick = handleCellClick;
    });

    // this.rootElement.querySelector('#undoBtn').onclick = event=>this.client.moves.undo();
    // this.rootElement.querySelector('#undoBtn').onclick = event=>this.client.undo();
    this.rootElement.querySelector('#clearBtn').onclick = event => {
      if (this._myturn) {
        this.client.moves.clear();
      }
    }
  }

  update(state) {
    // When using a remote master, the client won’t know the game state when it first runs
    if (state === null) return;
    this.onStart();

    this._myturn = state.isActive;
    this.rootElement.querySelector('header').innerText = `${this._myturn ? "Your Turn! " : ""}Player ${state.ctx.currentPlayer} (${state.G.players[state.ctx.currentPlayer].color}) Turn`;
    const cells = this.rootElement.querySelectorAll('.hex');

    cells.forEach(cell => {
      const cellId = parseId(cell.id)!;
      const cellValue = getCellValue(this.grid, state.G.stones, cellId[0], cellId[1]);
      cell.style.fill = cellValue !== null ? cellValue : '';
    });

    this.rootElement.querySelectorAll(".selected_hex").forEach(c => c.parentNode.removeChild(c));
    this.rootElement.querySelectorAll(".winning_hex").forEach(c => c.parentNode.removeChild(c));

    if (state.ctx.gameover) {
      console.log("game over", state.ctx.gameover);
      this.rootElement.querySelector("header").innerText = `player ${state.ctx.gameover.winner} (${state.ctx.gameover.color}) wins`;

      this.rootElement.querySelectorAll(".winning_hex").forEach(c => c.parentNode.removeChild(c));
      state.ctx.gameover.winning_line.map(h => this.grid.getHex(h)).forEach(hex => {
        const polygon = this.svg
          .polygon(hex.corners.map(({ x, y }) => `${x - this.xmin + DRAW_DATA.stroke_width},${y}`))
          .fill("none")
          .stroke({ width: DRAW_DATA.stroke_width, color: DRAW_DATA.colors.stroke_won })
          .attr({ class: 'winning_hex', });

        this.svg.group().add(polygon);
      });
      leaveGameRoom(this.client.playerID).then(() => { console.log("left match"); }, () => { console.error("failed to leave match"); });
    } else {
      state.G.current.map(s => this.grid.getHex(state.G.stones[s])).forEach(hex => {
        const polygon = this.svg
          .polygon(hex.corners.map(({ x, y }) => `${x - this.xmin + DRAW_DATA.stroke_width},${y}`))
          .fill("none")
          .stroke({ width: DRAW_DATA.stroke_width, color: DRAW_DATA.colors.stroke_selected })
          .attr({ class: 'selected_hex', });

        this.svg.group().add(polygon);
      });
    }
  }
}

function makeMoveDemo(node, move) {
  let item = node.appendChild(document.createElement("li"));
  let svg = SVG().addTo(item).size('100%', '100%');
  const Tile = defineHex({ origin: 'topLeft', dimensions: 15, });
  const grid = new Grid(Tile, spiral({ start: [3, 3], radius: 3 }));
  const STROKE_WIDTH = 3;
  grid.forEach(hex => {
    // create a polygon from a hex's corner points
    const polygon = svg
      .polygon(hex.corners.map(({ x, y }) => [x, y]).reduce((a, b) => a.concat(b), []))
      .fill(DRAW_DATA.colors.board)
      .stroke({ width: STROKE_WIDTH, color: DRAW_DATA.colors.stroke })
      .attr({ id: `demohex_${hex.q}_${hex.r}`, class: 'hex', });

    svg.group().add(polygon);
  });


  [...move.src].forEach((stone, i) => {
    const src_hex = grid.getHex(stone)!;
    const dx = grid.getHex(move.dest[i])!.corners[0].x - src_hex.corners[0].x;
    const dy = grid.getHex(move.dest[i])!.corners[0].y - src_hex.corners[0].y;
    const polygon = svg
      .polygon(src_hex.corners.map(({ x, y }) => [x, y]).reduce((a, b) => a.concat(b), []))
      .fill(stone.color)
      .stroke({ width: STROKE_WIDTH, color: DRAW_DATA.colors.stroke })
      .attr({ class: 'hex', }).animate(1000).dmove(dx, dy).loop(undefined, true, 100);

    svg.group().add(polygon.element());
  });
}

const demoUl = document.getElementById('move_list');
[
  {
    src: [
      { color: "black", q: 3, r: 3, },
      { color: "white", q: 3, r: 2, },
    ],
    dest: [
      { color: "black", q: 2, r: 3, },
      { color: "white", q: 2, r: 2, },
    ]
  },
  {
    src: [
      { color: "black", q: 3, r: 3, },
      { color: "white", q: 3, r: 2, },
    ],
    dest: [
      { color: "black", q: 3, r: 2, },
      { color: "white", q: 3, r: 1, },
    ]
  },
  {
    src: [
      { color: "black", q: 3, r: 3, },
      { color: "white", q: 3, r: 2, },
    ],
    dest: [
      { color: "black", q: 3, r: 2, },
      { color: "white", q: 3, r: 3, },
    ]
  }
].forEach(move => makeMoveDemo(demoUl, move));

document.getElementById("game_info_toggler")?.addEventListener("click", () => {
  let elem = document.getElementById('game_info')!;
  if (elem.style.display === 'none') { elem.style.display = 'block'; }
  else { elem.style.display = 'none'; }
});

// https://boardgame.io/documentation/#/api/Lobby
const lobbyClient = new LobbyClient({ server: SERVER_URL });

// current game data
let match_id: string | undefined = undefined;
let player_credentials: string | undefined = undefined;

async function newGameRoom() {
  const { matchID } = await lobbyClient.createMatch('default', {
    numPlayers: 2
  });
  await joinGameRoom("0", matchID);
}

async function joinGameRoom(playerID: string | null = null, matchID: string | null = null) {
  console.log("try join");
  if (matchID === null) {
    const { matches } = await lobbyClient.listMatches('default');
    console.log(matches);
    for (const m of matches) {
      console.log(m);
      if (m.players.length === 2 && m.players[1].isConnected === undefined) {
        matchID = m.matchID;
        break;
      }
    }
    if (matchID === null) {
      console.error("no available matches");
      await newGameRoom();
      return;
    }
  }

  console.log("try join", matchID);
  playerID = playerID || "1";
  const { playerCredentials } = await lobbyClient.joinMatch(
    'default',
    matchID,
    {
      playerID: playerID,
      playerName: new Date().toLocaleString(),
    }
  );
  match_id = matchID;
  player_credentials = playerCredentials;

  while (appElement!.firstChild) {
    appElement!.removeChild(appElement!.firstChild);
  }

  appElement!.appendChild(document.createElement('header'));
  const app = new GameClient(appElement, playerID, matchID, player_credentials);
  appElement!.style.visibility = "";
}

async function leaveGameRoom(playerID) {
  if (match_id && player_credentials) {
    await lobbyClient.leaveMatch('default', match_id, {
      playerID: playerID,
      credentials: player_credentials,
    });
  } else {
    console.error(`tried to leave a room, but match_id="${match_id}" and player_credentials="${player_credentials}"`);
  }
}

document.getElementById("new")!.onclick = async () => {
  await newGameRoom();
};
document.getElementById("join")!.onclick = async () => {
  await joinGameRoom();
};


const appElement = document.getElementById('app');
appElement!.style.visibility = "hidden";
